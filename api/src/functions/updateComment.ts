import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, getCommentById, updateCommentText } from '../database.js';
import { getUser } from '../auth.js';

let dbInitialized = false;

app.http('updateComment', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'components/{id}/comments/{commentId}',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const user = getUser(req);
      if (!user) {
        return { status: 401, jsonBody: { error: 'Authentication required' } };
      }

      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const componentId = req.params.id;
      const commentId = req.params.commentId;

      const comment = await getCommentById(componentId!, commentId!);
      if (!comment) {
        return { status: 404, jsonBody: { error: 'Comment not found' } };
      }

      if (comment.author_id !== user.userId) {
        return { status: 403, jsonBody: { error: 'Only the comment author can edit it' } };
      }

      const body = await req.json() as { text?: string };
      const text = body.text?.trim();
      if (!text) {
        return { status: 400, jsonBody: { error: 'Comment text is required' } };
      }
      if (text.length > 2000) {
        return { status: 400, jsonBody: { error: 'Comment must not exceed 2000 characters' } };
      }

      await updateCommentText(componentId!, commentId!, text);

      return { jsonBody: { message: 'Comment updated successfully' } };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'updateComment',
        method: req.method,
        url: req.url,
      };
      _context.error('[updateComment] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
