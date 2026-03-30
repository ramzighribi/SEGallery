import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getPool, initDatabase } from '../database.js';
import { generateReadSasUrl } from '../storage.js';

let dbInitialized = false;

// GET /api/components/{id}
app.http('getComponentById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'components/{id}',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
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

      const screenshotsResult = await pool.request()
        .input('cid', id)
        .query('SELECT * FROM Screenshots WHERE component_id = @cid ORDER BY sort_order ASC');

      const screenshots = screenshotsResult.recordset.map((s: any) => ({
        id: s.id,
        fileName: s.file_name,
        url: generateReadSasUrl(s.blob_url),
      }));

      return {
        jsonBody: {
          ...component,
          screenshots,
          fileUrl: generateReadSasUrl(component.file_blob_url),
        },
      };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'getComponentById',
        method: req.method,
        url: req.url,
      };
      _context.error('[getComponentById] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
