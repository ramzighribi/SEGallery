import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, upsertRating, getComponentById } from '../database.js';
import { getUser } from '../auth.js';

let dbInitialized = false;

app.http('rateComponent', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'ratings/{id}',
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

      const body = await req.json() as { rating?: number };
      const rating = body.rating;
      if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return { status: 400, jsonBody: { error: 'Rating must be an integer between 1 and 5' } };
      }

      const result = await upsertRating(id!, user.userId, rating);
      return { jsonBody: result };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'rateComponent',
        method: req.method,
        url: req.url,
      };
      _context.error('[rateComponent] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
