import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initDatabase, getComponentById, getScreenshotsByComponentId } from '../database.js';
import { generateReadSasUrl } from '../storage.js';

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

      const screenshots = await getScreenshotsByComponentId(id!);

      const screenshotResults = [];
      for (const s of screenshots) {
        screenshotResults.push({
          id: s.rowKey,
          fileName: s.file_name,
          url: await generateReadSasUrl(s.blob_url),
        });
      }

      return {
        jsonBody: {
          id: component.rowKey,
          title: component.title,
          description: component.description,
          file_name: component.file_name,
          file_blob_url: component.file_blob_url,
          author_name: component.author_name,
          author_email: component.author_email,
          author_id: component.author_id,
          created_at: component.created_at,
          updated_at: component.updated_at,
          fileUrl: await generateReadSasUrl(component.file_blob_url),
          screenshots: screenshotResults,
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
