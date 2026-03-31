import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, getComponentById, insertComment } from '../database.js';
import { getUser, getUserName } from '../auth.js';

let dbInitialized = false;

app.http('createComment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'components/{id}/comments',
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

      const body = await req.json() as { text?: string };
      const text = body.text?.trim();
      if (!text) {
        return { status: 400, jsonBody: { error: 'Comment text is required' } };
      }
      if (text.length > 2000) {
        return { status: 400, jsonBody: { error: 'Comment must not exceed 2000 characters' } };
      }

      const commentId = uuidv4();
      const now = new Date().toISOString();

      await insertComment({
        component_id: id!,
        rowKey: commentId,
        author_name: getUserName(user),
        author_id: user.userId,
        text,
        created_at: now,
        updated_at: now,
      });

      return {
        status: 201,
        jsonBody: {
          id: commentId,
          author_name: getUserName(user),
          author_id: user.userId,
          text,
          created_at: now,
          updated_at: now,
        },
      };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'createComment',
        method: req.method,
        url: req.url,
      };
      _context.error('[createComment] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
