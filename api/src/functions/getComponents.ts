import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, listComponents, getScreenshotsByComponentId } from '../database.js';
import { generateReadSasUrl } from '../storage.js';

let dbInitialized = false;

app.http('getComponents', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'components',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }

      const search = req.query.get('search')?.trim() || '';
      const page = Math.max(1, parseInt(req.query.get('page') || '1'));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.get('limit') || '12')));

      const { items, total } = await listComponents(search, page, limit);

      const result = [];
      for (const comp of items) {
        const screenshots = await getScreenshotsByComponentId(comp.rowKey);
        const thumbnail = screenshots[0];
        result.push({
          id: comp.rowKey,
          title: comp.title,
          description: comp.description,
          file_name: comp.file_name,
          author_name: comp.author_name,
          author_email: comp.author_email,
          author_id: comp.author_id,
          created_at: comp.created_at,
          thumbnail: thumbnail ? await generateReadSasUrl(thumbnail.blob_url) : null,
        });
      }

      return {
        jsonBody: {
          data: result,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'getComponents',
        method: req.method,
        url: req.url,
      };
      _context.error('[getComponents] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
