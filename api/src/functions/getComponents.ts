import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getPool, initDatabase } from '../database.js';
import { generateReadSasUrl } from '../storage.js';

let dbInitialized = false;

// GET /api/components?search=&page=&limit=
app.http('getComponents', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'components',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const pool = await getPool();

      const search = req.query.get('search')?.trim() || '';
      const page = Math.max(1, parseInt(req.query.get('page') || '1'));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.get('limit') || '12')));
      const offset = (page - 1) * limit;

      let countQuery: string;
      let dataQuery: string;
      const request = pool.request();

      if (search) {
        const searchPattern = `%${search}%`;
        request.input('search', searchPattern);
        request.input('limit', limit);
        request.input('offset', offset);

        countQuery = `SELECT COUNT(*) as total FROM Components WHERE title LIKE @search OR description LIKE @search OR author_name LIKE @search`;
        dataQuery = `SELECT * FROM Components WHERE title LIKE @search OR description LIKE @search OR author_name LIKE @search ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      } else {
        request.input('limit', limit);
        request.input('offset', offset);

        countQuery = `SELECT COUNT(*) as total FROM Components`;
        dataQuery = `SELECT * FROM Components ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      }

      const countResult = await pool.request()
        .input('search', `%${search}%`)
        .query(countQuery);
      const total = countResult.recordset[0].total;

      const dataReq = pool.request()
        .input('limit', limit)
        .input('offset', offset);
      if (search) dataReq.input('search', `%${search}%`);
      const dataResult = await dataReq.query(dataQuery);
      const components = dataResult.recordset;

      // Fetch first screenshot for each component
      const result = [];
      for (const comp of components) {
        const screenshotResult = await pool.request()
          .input('cid', comp.id)
          .query('SELECT TOP 1 * FROM Screenshots WHERE component_id = @cid ORDER BY sort_order ASC');

        const thumbnail = screenshotResult.recordset[0];
        result.push({
          ...comp,
          thumbnail: thumbnail ? generateReadSasUrl(thumbnail.blob_url) : null,
        });
      }

      return {
        jsonBody: {
          data: result,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      };
    } catch (err: any) {
      return { status: 500, jsonBody: { error: 'Internal server error', details: err.message } };
    }
  },
});
