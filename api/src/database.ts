import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

async function getAccessToken(): Promise<string> {
  const endpoint = process.env.IDENTITY_ENDPOINT;
  const header = process.env.IDENTITY_HEADER;

  if (!endpoint || !header) {
    throw new Error(
      'Managed identity not available: IDENTITY_ENDPOINT and IDENTITY_HEADER env vars are missing. ' +
      `IDENTITY_ENDPOINT=${endpoint ?? 'undefined'}, IDENTITY_HEADER=${header ? '[set]' : 'undefined'}`
    );
  }

  const resource = 'https://database.windows.net';
  const url = `${endpoint}?resource=${encodeURIComponent(resource)}&api-version=2019-08-01`;

  const response = await fetch(url, {
    headers: { 'X-IDENTITY-HEADER': header },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MSI token request failed (${response.status}): ${body}`);
  }

  const tokenResponse = await response.json() as { access_token: string };
  if (!tokenResponse.access_token) {
    throw new Error(`MSI token response missing access_token: ${JSON.stringify(tokenResponse)}`);
  }

  return tokenResponse.access_token;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;

  const server = process.env.SQL_SERVER;
  const database = process.env.SQL_DATABASE;
  if (!server || !database) {
    throw new Error('SQL_SERVER and SQL_DATABASE environment variables must be set');
  }

  const token = await getAccessToken();

  const config: sql.config = {
    server,
    database,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    authentication: {
      type: 'azure-active-directory-access-token',
      options: {
        token,
      },
    },
  };

  pool = await sql.connect(config);
  return pool;
}

export async function initDatabase(): Promise<void> {
  const p = await getPool();

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Components')
    CREATE TABLE Components (
      id NVARCHAR(36) PRIMARY KEY,
      title NVARCHAR(200) NOT NULL,
      description NVARCHAR(MAX) NOT NULL,
      file_name NVARCHAR(500) NOT NULL,
      file_blob_url NVARCHAR(2000) NOT NULL,
      author_name NVARCHAR(200) NOT NULL,
      author_email NVARCHAR(200) NOT NULL,
      author_id NVARCHAR(200) NOT NULL,
      created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
      updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    )
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Screenshots')
    CREATE TABLE Screenshots (
      id NVARCHAR(36) PRIMARY KEY,
      component_id NVARCHAR(36) NOT NULL,
      file_name NVARCHAR(500) NOT NULL,
      blob_url NVARCHAR(2000) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
      FOREIGN KEY (component_id) REFERENCES Components(id) ON DELETE CASCADE
    )
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Components_AuthorId')
    CREATE INDEX IX_Components_AuthorId ON Components(author_id)
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Screenshots_ComponentId')
    CREATE INDEX IX_Screenshots_ComponentId ON Screenshots(component_id)
  `);
}
