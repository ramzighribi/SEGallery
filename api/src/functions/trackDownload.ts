import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, incrementComponentField } from '../database.js';

let dbInitialized = false;

app.http('trackDownload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'components/{id}/download',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const id = req.params.id;
      const count = await incrementComponentField(id!, 'download_count');
      return { jsonBody: { download_count: count } };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'trackDownload',
        method: req.method,
        url: req.url,
      };
      _context.error('[trackDownload] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
