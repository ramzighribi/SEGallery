import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, getComponentById, getScreenshotsByComponentId, deleteScreenshotsByComponentId, getFilesByComponentId, deleteFilesByComponentId, deleteComponentById, deleteCommentsByComponentId } from '../database.js';
import { deleteBlob } from '../storage.js';
import { getUser } from '../auth.js';

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

app.http('deleteComponent', {
  methods: ['DELETE'],
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
        return { status: 403, jsonBody: { error: 'Only the component author can delete it' } };
      }

      // Delete screenshots blobs
      const screenshots = await getScreenshotsByComponentId(id!);
      for (const ss of screenshots) {
        const blobName = getBlobNameFromUrl(ss.blob_url);
        if (blobName) await deleteBlob('screenshots', blobName);
      }

      // Delete component file blob(s)
      const componentFiles = await getFilesByComponentId(id!);
      for (const f of componentFiles) {
        const bn = getBlobNameFromUrl(f.blob_url);
        if (bn) await deleteBlob('files', bn);
      }
      // Also delete primary file blob if not already covered
      const fileBlobName = getBlobNameFromUrl(component.file_blob_url);
      if (fileBlobName && !componentFiles.some(f => f.blob_url === component.file_blob_url)) {
        await deleteBlob('files', fileBlobName);
      }

      // Delete from Table Storage
      await deleteFilesByComponentId(id!);
      await deleteScreenshotsByComponentId(id!);
      await deleteCommentsByComponentId(id!);
      await deleteComponentById(id!);

      return { jsonBody: { message: 'Component deleted successfully' } };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'deleteComponent',
        method: req.method,
        url: req.url,
      };
      _context.error('[deleteComponent] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
