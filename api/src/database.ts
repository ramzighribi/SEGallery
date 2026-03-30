import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;

  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('SQL_CONNECTION_STRING environment variable is not set');
  }

  pool = await sql.connect(connectionString);
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
