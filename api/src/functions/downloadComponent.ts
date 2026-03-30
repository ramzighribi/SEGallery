import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, getComponentById, incrementComponentField } from '../database.js';
import { downloadBlobBuffer } from '../storage.js';

let dbInitialized = false;

function getBlobNameFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.slice(1).join('/');
  } catch {
    return '';
  }
}

function getContainerFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[0];
  } catch {
    return 'files';
  }
}

app.http('downloadComponent', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'downloads/{id}/file',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const id = req.params.id;

      const component = await getComponentById(id!);
      if (!component) {
        return { status: 404, jsonBody: { error: 'Component not found' } };
      }

      // Increment download count
      await incrementComponentField(id!, 'download_count').catch(() => {});

      const containerName = getContainerFromUrl(component.file_blob_url);
      const blobName = getBlobNameFromUrl(component.file_blob_url);

      const buffer = await downloadBlobBuffer(containerName, blobName);

      // Determine content type based on extension
      const ext = component.file_name.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === 'zip') contentType = 'application/zip';
      else if (ext === 'html' || ext === 'htm') contentType = 'application/octet-stream'; // Force download, not render

      return {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(component.file_name)}"`,
          'Content-Length': String(buffer.length),
        },
        body: buffer,
      };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'downloadComponent',
        method: req.method,
        url: req.url,
      };
      _context.error('[downloadComponent] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
