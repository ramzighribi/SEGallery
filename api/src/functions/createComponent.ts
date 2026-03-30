import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { getPool, initDatabase } from '../database.js';
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

// Simple multipart parser for Azure Functions
async function parseMultipart(req: HttpRequest): Promise<{ fields: Record<string, string>; files: { fieldName: string; fileName: string; contentType: string; data: Buffer }[] }> {
  const fields: Record<string, string> = {};
  const files: { fieldName: string; fileName: string; contentType: string; data: Buffer }[] = [];

  const formData = await req.formData();

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      fields[key] = value;
    } else {
      // It's a File/Blob
      const file = value as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      files.push({
        fieldName: key,
        fileName: file.name,
        contentType: file.type,
        data: buffer,
      });
    }
  }

  return { fields, files };
}

// POST /api/components
app.http('createComponent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'components',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Auth check
      const user = getUser(req);
      if (!user) {
        return { status: 401, jsonBody: { error: 'Authentication required. Please sign in.' } };
      }

      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const pool = await getPool();

      // Parse multipart form
      const { fields, files } = await parseMultipart(req);

      const title = fields.title?.trim();
      const description = fields.description?.trim();

      if (!title || !description) {
        return { status: 400, jsonBody: { error: 'Title and description are required' } };
      }

      if (title.length > 200) {
        return { status: 400, jsonBody: { error: 'Title must not exceed 200 characters' } };
      }

      // Find the component file
      const componentFile = files.find((f) => f.fieldName === 'file');
      if (!componentFile) {
        return { status: 400, jsonBody: { error: 'A component file (zip or html) is required' } };
      }

      const fileExt = getExtension(componentFile.fileName);
      if (!ALLOWED_FILE_EXT.includes(fileExt)) {
        return { status: 400, jsonBody: { error: 'Only .zip, .html, .htm files are allowed' } };
      }

      // Validate file size (50MB)
      if (componentFile.data.length > 50 * 1024 * 1024) {
        return { status: 400, jsonBody: { error: 'File must not exceed 50MB' } };
      }

      // Find screenshots
      const screenshotFiles = files.filter((f) => f.fieldName === 'screenshots');
      if (screenshotFiles.length > 10) {
        return { status: 400, jsonBody: { error: 'Maximum 10 screenshots allowed' } };
      }

      for (const ss of screenshotFiles) {
        const ext = getExtension(ss.fileName);
        if (!ALLOWED_IMG_EXT.includes(ext)) {
          return { status: 400, jsonBody: { error: `Invalid screenshot format: ${ss.fileName}. Only png, jpg, jpeg, gif, webp allowed.` } };
        }
      }

      const componentId = uuidv4();
      const userName = getUserName(user);
      const userEmail = getUserEmail(user);

      // Upload component file to Blob Storage
      const fileBlobName = `${componentId}/${uuidv4()}${fileExt}`;
      const fileBlobUrl = await uploadBlob('files', fileBlobName, componentFile.data, componentFile.contentType);

      // Insert component
      await pool.request()
        .input('id', componentId)
        .input('title', title)
        .input('description', description)
        .input('file_name', componentFile.fileName)
        .input('file_blob_url', fileBlobUrl)
        .input('author_name', userName)
        .input('author_email', userEmail)
        .input('author_id', user.userId)
        .query(`
          INSERT INTO Components (id, title, description, file_name, file_blob_url, author_name, author_email, author_id)
          VALUES (@id, @title, @description, @file_name, @file_blob_url, @author_name, @author_email, @author_id)
        `);

      // Upload and insert screenshots
      for (let i = 0; i < screenshotFiles.length; i++) {
        const ss = screenshotFiles[i];
        const ssExt = getExtension(ss.fileName);
        const ssBlobName = `${componentId}/${uuidv4()}${ssExt}`;
        const ssBlobUrl = await uploadBlob('screenshots', ssBlobName, ss.data, ss.contentType);
        const ssId = uuidv4();

        await pool.request()
          .input('id', ssId)
          .input('component_id', componentId)
          .input('file_name', ss.fileName)
          .input('blob_url', ssBlobUrl)
          .input('sort_order', i)
          .query(`
            INSERT INTO Screenshots (id, component_id, file_name, blob_url, sort_order)
            VALUES (@id, @component_id, @file_name, @blob_url, @sort_order)
          `);
      }

      return {
        status: 201,
        jsonBody: { id: componentId, message: 'Component created successfully' },
      };
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
