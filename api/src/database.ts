import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

async function getAccessToken(): Promise<string> {
  const resource = 'https://database.windows.net';

  const msiEndpoint = process.env.MSI_ENDPOINT;
  const msiSecret = process.env.MSI_SECRET;
  const identityEndpoint = process.env.IDENTITY_ENDPOINT;
  const identityHeader = process.env.IDENTITY_HEADER;

  // Build a list of strategies to try in order
  const strategies: { name: string; url: string; headers: Record<string, string> }[] = [];

  if (msiEndpoint && msiSecret) {
    strategies.push({
      name: 'MSI_ENDPOINT+MSI_SECRET',
      url: `${msiEndpoint}?resource=${encodeURIComponent(resource)}&api-version=2017-09-01`,
      headers: { 'Secret': msiSecret },
    });
  }

  if (identityEndpoint && identityHeader) {
    strategies.push({
      name: 'IDENTITY_ENDPOINT+IDENTITY_HEADER',
      url: `${identityEndpoint}?resource=${encodeURIComponent(resource)}&api-version=2019-08-01`,
      headers: { 'X-IDENTITY-HEADER': identityHeader },
    });
  }

  // SWA managed functions: endpoint exists but no secret — call without auth header
  if (identityEndpoint && !identityHeader) {
    strategies.push({
      name: 'IDENTITY_ENDPOINT (no header)',
      url: `${identityEndpoint}?resource=${encodeURIComponent(resource)}&api-version=2019-08-01`,
      headers: {},
    });
  }

  if (msiEndpoint && !msiSecret) {
    strategies.push({
      name: 'MSI_ENDPOINT (no secret)',
      url: `${msiEndpoint}?resource=${encodeURIComponent(resource)}&api-version=2017-09-01`,
      headers: {},
    });
  }

  if (strategies.length === 0) {
    const envDump = Object.entries(process.env)
      .filter(([k]) => /identity|msi|endpoint|secret|header/i.test(k))
      .map(([k, v]) => `${k}=${v ? '[set]' : 'undefined'}`)
      .join(', ');
    throw new Error(`No MSI endpoint available. Env vars: ${envDump || 'none'}`);
  }

  const errors: string[] = [];

  for (const strategy of strategies) {
    try {
      const response = await fetch(strategy.url, { headers: strategy.headers });

      if (!response.ok) {
        const body = await response.text();
        errors.push(`[${strategy.name}] HTTP ${response.status}: ${body}`);
        continue;
      }

      const tokenResponse = await response.json() as { access_token?: string };
      if (!tokenResponse.access_token) {
        errors.push(`[${strategy.name}] No access_token in response: ${JSON.stringify(tokenResponse)}`);
        continue;
      }

      return tokenResponse.access_token;
    } catch (err: any) {
      errors.push(`[${strategy.name}] ${err.message}`);
    }
  }

  throw new Error(`All MSI strategies failed:\n${errors.join('\n')}`);
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
