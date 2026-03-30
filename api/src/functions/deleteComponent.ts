import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getPool, initDatabase } from '../database.js';
import { deleteBlob } from '../storage.js';
import { getUser } from '../auth.js';

let dbInitialized = false;

function getBlobNameFromUrl(blobUrl: string): string {
  try {
    const url = new URL(blobUrl);
    // Remove leading slash and container name
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.slice(1).join('/');
  } catch {
    return '';
  }
}

// DELETE /api/components/{id}
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
      const pool = await getPool();
      const id = req.params.id;

      const compResult = await pool.request()
        .input('id', id)
        .query('SELECT * FROM Components WHERE id = @id');

      if (compResult.recordset.length === 0) {
        return { status: 404, jsonBody: { error: 'Component not found' } };
      }

      const component = compResult.recordset[0];

      if (component.author_id !== user.userId) {
        return { status: 403, jsonBody: { error: 'Only the component author can delete it' } };
      }

      // Delete screenshots blobs
      const ssResult = await pool.request()
        .input('cid', id)
        .query('SELECT * FROM Screenshots WHERE component_id = @cid');

      for (const ss of ssResult.recordset) {
        const blobName = getBlobNameFromUrl(ss.blob_url);
        if (blobName) await deleteBlob('screenshots', blobName);
      }

      // Delete component file blob
      const fileBlobName = getBlobNameFromUrl(component.file_blob_url);
      if (fileBlobName) await deleteBlob('files', fileBlobName);

      // Delete from DB (CASCADE will delete screenshots)
      await pool.request()
        .input('id', id)
        .query('DELETE FROM Components WHERE id = @id');

      return { jsonBody: { message: 'Component deleted successfully' } };
    } catch (err: any) {
      return { status: 500, jsonBody: { error: 'Internal server error', details: err.message } };
    }
  },
});
