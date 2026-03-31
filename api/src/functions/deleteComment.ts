import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, getCommentById, deleteComment } from '../database.js';
import { getUser } from '../auth.js';

let dbInitialized = false;

app.http('deleteComment', {
  methods: ['DELETE'],
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
        return { status: 403, jsonBody: { error: 'Only the comment author can delete it' } };
      }

      await deleteComment(componentId!, commentId!);

      return { jsonBody: { message: 'Comment deleted successfully' } };
    } catch (err: any) {
      const errorDetail = {
        error: 'Internal server error',
        message: err.message || String(err),
        stack: err.stack || null,
        code: err.code || null,
        timestamp: new Date().toISOString(),
        function: 'deleteComment',
        method: req.method,
        url: req.url,
      };
      _context.error('[deleteComment] UNHANDLED ERROR:', JSON.stringify(errorDetail, null, 2));
      return { status: 500, jsonBody: errorDetail };
    }
  },
});
