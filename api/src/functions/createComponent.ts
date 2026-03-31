import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, insertComponent, insertScreenshot, insertFile } from '../database.js';
import { uploadBlob } from '../storage.js';
import { getUser, getUserName, getUserEmail } from '../auth.js';

let dbInitialized = false;

// Allowed extensions
const ALLOWED_FILE_EXT = ['.zip', '.html', '.htm'];
const ALLOWED_IMG_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.substring(idx).toLowerCase() : '';
}

async function parseMultipart(req: HttpRequest): Promise<{ fields: Record<string, string>; files: { fieldName: string; fileName: string; contentType: string; data: Buffer }[] }> {
  const fields: Record<string, string> = {};
  const files: { fieldName: string; fileName: string; contentType: string; data: Buffer }[] = [];
  const formData = await req.formData();
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      fields[key] = value;
    } else {
      const file = value as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      files.push({ fieldName: key, fileName: file.name, contentType: file.type, data: buffer });
    }
  }
  return { fields, files };
}

app.http('createComponent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'components',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const user = getUser(req);
      if (!user) {
        return { status: 401, jsonBody: { error: 'Authentication required. Please sign in.' } };
      }

      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }

      const { fields, files } = await parseMultipart(req);
      const title = fields.title?.trim();
      const description = fields.description?.trim();
      const tags = fields.tags?.trim() || '[]';

      if (!title || !description) {
        return { status: 400, jsonBody: { error: 'Title and description are required' } };
      }
      if (title.length > 200) {
        return { status: 400, jsonBody: { error: 'Title must not exceed 200 characters' } };
      }

      // Validate tags JSON
      let parsedTags: string[] = [];
      try { parsedTags = JSON.parse(tags); } catch { /* empty */ }
      if (!Array.isArray(parsedTags)) parsedTags = [];

      const componentFile = files.find((f) => f.fieldName === 'file');
      const componentFiles = files.filter((f) => f.fieldName === 'file' || f.fieldName === 'files');
      if (componentFiles.length === 0) {
        return { status: 400, jsonBody: { error: 'At least one component file (zip or html) is required' } };
      }
      if (componentFiles.length > 20) {
        return { status: 400, jsonBody: { error: 'Maximum 20 files allowed' } };
      }

      for (const cf of componentFiles) {
        const fileExt = getExtension(cf.fileName);
        if (!ALLOWED_FILE_EXT.includes(fileExt)) {
          return { status: 400, jsonBody: { error: `Only .zip, .html, .htm files are allowed: ${cf.fileName}` } };
        }
        if (cf.data.length > 50 * 1024 * 1024) {
          return { status: 400, jsonBody: { error: `File must not exceed 50MB: ${cf.fileName}` } };
        }
      }

      const screenshotFiles = files.filter((f) => f.fieldName === 'screenshots');
      if (screenshotFiles.length > 10) {
        return { status: 400, jsonBody: { error: 'Maximum 10 screenshots allowed' } };
      }
      for (const ss of screenshotFiles) {
        if (!ALLOWED_IMG_EXT.includes(getExtension(ss.fileName))) {
          return { status: 400, jsonBody: { error: `Invalid screenshot format: ${ss.fileName}` } };
        }
      }

      const componentId = uuidv4();
      const now = new Date().toISOString();

      // Upload component files (first file is the "primary" for backward compat)
      const primaryFile = componentFiles[0];
      const primaryFileExt = getExtension(primaryFile.fileName);
      const primaryBlobName = `${componentId}/${uuidv4()}${primaryFileExt}`;
      const primaryBlobUrl = await uploadBlob('files', primaryBlobName, primaryFile.data, primaryFile.contentType);

      // Insert component in Table Storage (primary file info for backward compat)
      await insertComponent({
        rowKey: componentId,
        title,
        description,
        file_name: primaryFile.fileName,
        file_blob_url: primaryBlobUrl,
        author_name: getUserName(user),
        author_email: getUserEmail(user),
        author_id: user.userId,
        tags: JSON.stringify(parsedTags),
        created_at: now,
        updated_at: now,
        view_count: 0,
        download_count: 0,
        rating_sum: 0,
        rating_count: 0,
      });

      // Insert all files into Files table
      for (let i = 0; i < componentFiles.length; i++) {
        const cf = componentFiles[i];
        const ext = getExtension(cf.fileName);
        let blobUrl: string;
        if (i === 0) {
          blobUrl = primaryBlobUrl;
        } else {
          const blobName = `${componentId}/${uuidv4()}${ext}`;
          blobUrl = await uploadBlob('files', blobName, cf.data, cf.contentType);
        }
        await insertFile({
          component_id: componentId,
          rowKey: uuidv4(),
          file_name: cf.fileName,
          blob_url: blobUrl,
          content_type: cf.contentType,
          file_size: cf.data.length,
          sort_order: i,
          created_at: now,
        });
      }

      // Upload and insert screenshots
      for (let i = 0; i < screenshotFiles.length; i++) {
        const ss = screenshotFiles[i];
        const ssExt = getExtension(ss.fileName);
        const ssBlobName = `${componentId}/${uuidv4()}${ssExt}`;
        const ssBlobUrl = await uploadBlob('screenshots', ssBlobName, ss.data, ss.contentType);

        await insertScreenshot({
          component_id: componentId,
          rowKey: uuidv4(),
          file_name: ss.fileName,
          blob_url: ssBlobUrl,
          sort_order: i,
          created_at: now,
        });
      }

      return { status: 201, jsonBody: { id: componentId, message: 'Component created successfully' } };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'createComponent',
        method: req.method,
        url: req.url,
      };
      _context.error('[createComponent] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
