import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, getComponentById, getScreenshotsByComponentId, getFilesByComponentId, incrementComponentField, getUserRating } from '../database.js';
import { generateReadSasUrl } from '../storage.js';
import { getUser } from '../auth.js';

let dbInitialized = false;

app.http('getComponentById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'components/{id}',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      if (!dbInitialized) { await initDatabase(); dbInitialized = true; }
      const id = req.params.id;

      const component = await getComponentById(id!);
      if (!component) {
        return { status: 404, jsonBody: { error: 'Component not found' } };
      }

      // Increment view count
      const viewCount = await incrementComponentField(id!, 'view_count');

      const screenshots = await getScreenshotsByComponentId(id!);

      const screenshotResults = [];
      for (const s of screenshots) {
        screenshotResults.push({
          id: s.rowKey,
          fileName: s.file_name,
          url: await generateReadSasUrl(s.blob_url),
        });
      }

      // Get files list (may be empty for old components)
      const componentFiles = await getFilesByComponentId(id!);
      const fileResults = [];
      if (componentFiles.length > 0) {
        for (const f of componentFiles) {
          fileResults.push({
            id: f.rowKey,
            fileName: f.file_name,
            contentType: f.content_type,
            fileSize: f.file_size,
          });
        }
      } else {
        // Backward compat: present single file as files array
        fileResults.push({
          id: 'primary',
          fileName: component.file_name,
          contentType: '',
          fileSize: 0,
        });
      }

      // Get user's existing rating (if authenticated)
      const user = getUser(req);
      let userRating: number | null = null;
      if (user) {
        userRating = await getUserRating(id!, user.userId);
      }

      // Parse tags
      let tags: string[] = [];
      try { tags = JSON.parse(component.tags || '[]'); } catch { /* empty */ }

      return {
        jsonBody: {
          id: component.rowKey,
          title: component.title,
          description: component.description,
          file_name: component.file_name,
          file_blob_url: component.file_blob_url,
          author_name: component.author_name,
          author_id: component.author_id,
          created_at: component.created_at,
          updated_at: component.updated_at,
          tags,
          view_count: viewCount,
          download_count: component.download_count || 0,
          average_rating: (component.rating_count || 0) > 0 ? (component.rating_sum || 0) / (component.rating_count || 0) : 0,
          rating_count: component.rating_count || 0,
          user_rating: userRating,
          fileUrl: await generateReadSasUrl(component.file_blob_url),
          screenshots: screenshotResults,
          files: fileResults,
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
