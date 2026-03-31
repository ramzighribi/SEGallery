import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, getComponentById, updateComponent, insertScreenshot, insertFile, getScreenshotsByComponentId, deleteScreenshotsByComponentId, getFilesByComponentId, deleteFilesByComponentId } from '../database.js';
import { uploadBlob, deleteBlob } from '../storage.js';
import { getUser } from '../auth.js';

let dbInitialized = false;

const ALLOWED_FILE_EXT = ['.zip', '.html', '.htm'];
const ALLOWED_IMG_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.substring(idx).toLowerCase() : '';
}

function getBlobNameFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.slice(1).join('/');
  } catch {
    return '';
  }
}

app.http('updateComponent', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'components/{id}',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const user = getUser(req);
      if (!user) {
        return { status: 401, jsonBody: { error: 'Authentication required' } };
      }

      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const id = req.params.id;

      const component = await getComponentById(id!);
      if (!component) {
        return { status: 404, jsonBody: { error: 'Component not found' } };
      }

      if (component.author_id !== user.userId) {
        return { status: 403, jsonBody: { error: 'Only the component author can edit it' } };
      }

      const formData = await req.formData();
      const fields: Record<string, string> = {};
      const files: { fieldName: string; fileName: string; contentType: string; data: Buffer }[] = [];

      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          fields[key] = value;
        } else {
          const file = value as File;
          const buffer = Buffer.from(await file.arrayBuffer());
          files.push({ fieldName: key, fileName: file.name, contentType: file.type, data: buffer });
        }
      }

      const title = fields.title?.trim();
      const description = fields.description?.trim();

      if (!title || !description) {
        return { status: 400, jsonBody: { error: 'Title and description are required' } };
      }
      if (title.length > 200) {
        return { status: 400, jsonBody: { error: 'Title must not exceed 200 characters' } };
      }

      const now = new Date().toISOString();
      const updates: Record<string, string> = { title, description, updated_at: now };

      // Handle tags
      const tagsStr = fields.tags?.trim();
      if (tagsStr !== undefined) {
        let parsedTags: string[] = [];
        try { parsedTags = JSON.parse(tagsStr); } catch { /* empty */ }
        if (!Array.isArray(parsedTags)) parsedTags = [];
        updates.tags = JSON.stringify(parsedTags);
      }

      // Handle optional new file(s)
      const componentFiles = files.filter((f) => f.fieldName === 'file' || f.fieldName === 'files');
      if (componentFiles.length > 0) {
        // Validate all files
        for (const cf of componentFiles) {
          const fileExt = getExtension(cf.fileName);
          if (!ALLOWED_FILE_EXT.includes(fileExt)) {
            return { status: 400, jsonBody: { error: `Only .zip, .html, .htm files are allowed: ${cf.fileName}` } };
          }
          if (cf.data.length > 50 * 1024 * 1024) {
            return { status: 400, jsonBody: { error: `File must not exceed 50MB: ${cf.fileName}` } };
          }
        }

        // Delete old file blobs
        const oldFiles = await getFilesByComponentId(id!);
        for (const of_ of oldFiles) {
          const bn = getBlobNameFromUrl(of_.blob_url);
          if (bn) await deleteBlob('files', bn);
        }
        await deleteFilesByComponentId(id!);

        // Also delete old primary file blob
        const oldBlobName = getBlobNameFromUrl(component.file_blob_url);
        if (oldBlobName && !oldFiles.some(f => f.blob_url === component.file_blob_url)) {
          await deleteBlob('files', oldBlobName);
        }

        // Upload new files
        const primaryFile = componentFiles[0];
        const primaryExt = getExtension(primaryFile.fileName);
        const primaryBlobName = `${id}/${uuidv4()}${primaryExt}`;
        const primaryBlobUrl = await uploadBlob('files', primaryBlobName, primaryFile.data, primaryFile.contentType);
        updates.file_name = primaryFile.fileName;
        updates.file_blob_url = primaryBlobUrl;

        for (let i = 0; i < componentFiles.length; i++) {
          const cf = componentFiles[i];
          const ext = getExtension(cf.fileName);
          let blobUrl: string;
          if (i === 0) {
            blobUrl = primaryBlobUrl;
          } else {
            const blobName = `${id}/${uuidv4()}${ext}`;
            blobUrl = await uploadBlob('files', blobName, cf.data, cf.contentType);
          }
          await insertFile({
            component_id: id!,
            rowKey: uuidv4(),
            file_name: cf.fileName,
            blob_url: blobUrl,
            content_type: cf.contentType,
            file_size: cf.data.length,
            sort_order: i,
            created_at: now,
          });
        }
      }

      await updateComponent(id!, updates);

      // Handle optional new screenshots (replaceScreenshots flag)
      const replaceScreenshots = fields.replaceScreenshots === 'true';
      if (replaceScreenshots) {
        // Delete old screenshots
        const oldScreenshots = await getScreenshotsByComponentId(id!);
        for (const ss of oldScreenshots) {
          const blobName = getBlobNameFromUrl(ss.blob_url);
          if (blobName) await deleteBlob('screenshots', blobName);
        }
        await deleteScreenshotsByComponentId(id!);

        // Upload new screenshots
        const screenshotFiles = files.filter((f) => f.fieldName === 'screenshots');
        for (let i = 0; i < screenshotFiles.length; i++) {
          const ss = screenshotFiles[i];
          const ssExt = getExtension(ss.fileName);
          if (!ALLOWED_IMG_EXT.includes(ssExt)) continue;

          const ssBlobName = `${id}/${uuidv4()}${ssExt}`;
          const ssBlobUrl = await uploadBlob('screenshots', ssBlobName, ss.data, ss.contentType);

          await insertScreenshot({
            component_id: id!,
            rowKey: uuidv4(),
            file_name: ss.fileName,
            blob_url: ssBlobUrl,
            sort_order: i,
            created_at: now,
          });
        }
      }

      return { jsonBody: { message: 'Component updated successfully' } };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'updateComponent',
        method: req.method,
        url: req.url,
      };
      _context.error('[updateComponent] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
