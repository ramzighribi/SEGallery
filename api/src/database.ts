import { TableClient, TableServiceClient, odata } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';

// Table names
const COMPONENTS_TABLE = 'Components';
const SCREENSHOTS_TABLE = 'Screenshots';

let tablesInitialized = false;

const credential = new DefaultAzureCredential();

function getTableUrl(): string {
  const account = process.env.STORAGE_ACCOUNT_NAME;
  if (!account) throw new Error('STORAGE_ACCOUNT_NAME is not set');
  return `https://${account}.table.core.windows.net`;
}

export function getComponentsTable(): TableClient {
  return new TableClient(getTableUrl(), COMPONENTS_TABLE, credential);
}

export function getScreenshotsTable(): TableClient {
  return new TableClient(getTableUrl(), SCREENSHOTS_TABLE, credential);
}

export async function initDatabase(): Promise<void> {
  if (tablesInitialized) return;
  const svc = new TableServiceClient(getTableUrl(), credential);
  // createTable is idempotent (409 if exists is ignored)
  await svc.createTable(COMPONENTS_TABLE).catch(() => {});
  await svc.createTable(SCREENSHOTS_TABLE).catch(() => {});
  tablesInitialized = true;
}

// --- Component helpers ---

export interface ComponentEntity {
  partitionKey: string;   // fixed "C"
  rowKey: string;         // component id
  title: string;
  description: string;
  file_name: string;
  file_blob_url: string;
  author_name: string;
  author_email: string;
  author_id: string;
  created_at: string;     // ISO string
  updated_at: string;
}

export interface ScreenshotEntity {
  partitionKey: string;   // component id
  rowKey: string;         // screenshot id
  file_name: string;
  blob_url: string;
  sort_order: number;
  created_at: string;
}

export async function insertComponent(comp: Omit<ComponentEntity, 'partitionKey'>): Promise<void> {
  const table = getComponentsTable();
  await table.createEntity({ ...comp, partitionKey: 'C' });
}

export async function getComponentById(id: string): Promise<ComponentEntity | null> {
  const table = getComponentsTable();
  try {
    const entity = await table.getEntity('C', id);
    return entity as unknown as ComponentEntity;
  } catch (e: any) {
    if (e.statusCode === 404) return null;
    throw e;
  }
}

export async function deleteComponentById(id: string): Promise<void> {
  const table = getComponentsTable();
  await table.deleteEntity('C', id);
}

export async function listComponents(search: string, page: number, limit: number): Promise<{ items: ComponentEntity[]; total: number }> {
  const table = getComponentsTable();
  const all: ComponentEntity[] = [];

  // Table Storage doesn't support LIKE — we fetch all and filter in memory
  const iter = table.listEntities<ComponentEntity>({ queryOptions: { filter: odata`PartitionKey eq 'C'` } });
  for await (const entity of iter) {
    if (search) {
      const s = search.toLowerCase();
      const match =
        (entity.title || '').toLowerCase().includes(s) ||
        (entity.description || '').toLowerCase().includes(s) ||
        (entity.author_name || '').toLowerCase().includes(s);
      if (!match) continue;
    }
    all.push(entity as unknown as ComponentEntity);
  }

  // Sort by created_at descending
  all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

  const total = all.length;
  const offset = (page - 1) * limit;
  const items = all.slice(offset, offset + limit);

  return { items, total };
}

// --- Screenshot helpers ---

export async function insertScreenshot(ss: Omit<ScreenshotEntity, 'partitionKey'> & { component_id: string }): Promise<void> {
  const table = getScreenshotsTable();
  await table.createEntity({
    partitionKey: ss.component_id,
    rowKey: ss.rowKey,
    file_name: ss.file_name,
    blob_url: ss.blob_url,
    sort_order: ss.sort_order,
    created_at: ss.created_at,
  });
}

export async function getScreenshotsByComponentId(componentId: string): Promise<ScreenshotEntity[]> {
  const table = getScreenshotsTable();
  const results: ScreenshotEntity[] = [];
  const iter = table.listEntities<ScreenshotEntity>({
    queryOptions: { filter: odata`PartitionKey eq ${componentId}` },
  });
  for await (const entity of iter) {
    results.push(entity as unknown as ScreenshotEntity);
  }
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function deleteScreenshotsByComponentId(componentId: string): Promise<ScreenshotEntity[]> {
  const table = getScreenshotsTable();
  const screenshots = await getScreenshotsByComponentId(componentId);
  for (const ss of screenshots) {
    await table.deleteEntity(componentId, ss.rowKey);
  }
  return screenshots;
}
