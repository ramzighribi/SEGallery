import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, getComponentById, getCommentsByComponentId } from '../database.js';

let dbInitialized = false;

app.http('getComments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'components/{id}/comments',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const id = req.params.id;

      const component = await getComponentById(id!);
      if (!component) {
        return { status: 404, jsonBody: { error: 'Component not found' } };
      }

      const comments = await getCommentsByComponentId(id!);
      const result = comments.map((c) => ({
        id: c.rowKey,
        author_name: c.author_name,
        author_id: c.author_id,
        text: c.text,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      return { jsonBody: result };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'getComments',
        method: req.method,
        url: req.url,
      };
      _context.error('[getComments] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
