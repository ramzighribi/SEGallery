import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

app.http('healthCheck', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    return {
      jsonBody: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
          IDENTITY_ENDPOINT: process.env.IDENTITY_ENDPOINT ? 'SET' : 'NOT_SET',
          IDENTITY_HEADER: process.env.IDENTITY_HEADER ? 'SET' : 'NOT_SET',
          MSI_ENDPOINT: process.env.MSI_ENDPOINT ? 'SET' : 'NOT_SET',
          MSI_SECRET: process.env.MSI_SECRET ? 'SET' : 'NOT_SET',
          STORAGE_ACCOUNT_NAME: process.env.STORAGE_ACCOUNT_NAME || 'NOT_SET',
          WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME || 'NOT_SET',
          FUNCTIONS_WORKER_RUNTIME: process.env.FUNCTIONS_WORKER_RUNTIME || 'NOT_SET',
          AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID ? 'SET' : 'NOT_SET',
        },
      },
    };
  },
});
