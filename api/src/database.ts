import { TableClient, TableServiceClient, odata } from '@azure/data-tables';
import { credential } from './credential';

// Table names
const COMPONENTS_TABLE = 'Components';
const SCREENSHOTS_TABLE = 'Screenshots';
const RATINGS_TABLE = 'Ratings';
const FILES_TABLE = 'Files';

let tablesInitialized = false;

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

export function getRatingsTable(): TableClient {
  return new TableClient(getTableUrl(), RATINGS_TABLE, credential);
}

export function getFilesTable(): TableClient {
  return new TableClient(getTableUrl(), FILES_TABLE, credential);
}

export async function initDatabase(): Promise<void> {
  if (tablesInitialized) return;
  const svc = new TableServiceClient(getTableUrl(), credential);
  // createTable is idempotent (409 if exists is ignored)
  await svc.createTable(COMPONENTS_TABLE).catch(() => {});
  await svc.createTable(SCREENSHOTS_TABLE).catch(() => {});
  await svc.createTable(RATINGS_TABLE).catch(() => {});
  await svc.createTable(FILES_TABLE).catch(() => {});
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
  view_count: number;
  download_count: number;
  rating_sum: number;
  rating_count: number;
}

export interface RatingEntity {
  partitionKey: string;   // component id
  rowKey: string;         // user id
  rating: number;         // 1-5
  created_at: string;
}

export interface ScreenshotEntity {
  partitionKey: string;   // component id
  rowKey: string;         // screenshot id
  file_name: string;
  blob_url: string;
  sort_order: number;
  created_at: string;
}

export interface FileEntity {
  partitionKey: string;   // component id
  rowKey: string;         // file id
  file_name: string;
  blob_url: string;
  content_type: string;
  file_size: number;
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

export async function updateComponent(id: string, updates: Partial<Pick<ComponentEntity, 'title' | 'description' | 'file_name' | 'file_blob_url' | 'updated_at'>>): Promise<void> {
  const table = getComponentsTable();
  await table.updateEntity({ partitionKey: 'C', rowKey: id, ...updates }, 'Merge');
}

export async function incrementComponentField(id: string, field: 'view_count' | 'download_count'): Promise<number> {
  const table = getComponentsTable();
  const entity = await table.getEntity('C', id);
  const current = (entity[field] as number) || 0;
  const updated = current + 1;
  await table.updateEntity({ partitionKey: 'C', rowKey: id, [field]: updated }, 'Merge');
  return updated;
}

export async function listComponents(search: string, page: number, limit: number, sort: 'asc' | 'desc' = 'desc'): Promise<{ items: ComponentEntity[]; total: number }> {
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

  // Sort by created_at
  if (sort === 'asc') {
    all.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  } else {
    all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }

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

// --- Rating helpers ---

export async function upsertRating(componentId: string, userId: string, rating: number): Promise<{ average_rating: number; rating_count: number }> {
  const ratingsTable = getRatingsTable();
  const componentsTable = getComponentsTable();

  // Get component current rating data
  const component = await componentsTable.getEntity('C', componentId);
  let currentSum = (component.rating_sum as number) || 0;
  let currentCount = (component.rating_count as number) || 0;

  // Check if user already rated
  let existingRating: number | null = null;
  try {
    const existing = await ratingsTable.getEntity(componentId, userId);
    existingRating = existing.rating as number;
  } catch (e: any) {
    if (e.statusCode !== 404) throw e;
  }

  if (existingRating !== null) {
    // Update: adjust sum
    currentSum = currentSum - existingRating + rating;
  } else {
    // New rating
    currentSum += rating;
    currentCount += 1;
  }

  // Upsert the rating record
  await ratingsTable.upsertEntity({
    partitionKey: componentId,
    rowKey: userId,
    rating,
    created_at: new Date().toISOString(),
  }, 'Replace');

  // Update component aggregates
  await componentsTable.updateEntity({
    partitionKey: 'C',
    rowKey: componentId,
    rating_sum: currentSum,
    rating_count: currentCount,
  }, 'Merge');

  const average_rating = currentCount > 0 ? currentSum / currentCount : 0;
  return { average_rating, rating_count: currentCount };
}

export async function getUserRating(componentId: string, userId: string): Promise<number | null> {
  const table = getRatingsTable();
  try {
    const entity = await table.getEntity(componentId, userId);
    return entity.rating as number;
  } catch (e: any) {
    if (e.statusCode === 404) return null;
    throw e;
  }
}

// --- File helpers ---

export async function insertFile(file: Omit<FileEntity, 'partitionKey'> & { component_id: string }): Promise<void> {
  const table = getFilesTable();
  await table.createEntity({
    partitionKey: file.component_id,
    rowKey: file.rowKey,
    file_name: file.file_name,
    blob_url: file.blob_url,
    content_type: file.content_type,
    file_size: file.file_size,
    sort_order: file.sort_order,
    created_at: file.created_at,
  });
}

export async function getFilesByComponentId(componentId: string): Promise<FileEntity[]> {
  const table = getFilesTable();
  const results: FileEntity[] = [];
  const iter = table.listEntities<FileEntity>({
    queryOptions: { filter: odata`PartitionKey eq ${componentId}` },
  });
  for await (const entity of iter) {
    results.push(entity as unknown as FileEntity);
  }
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function getFileById(componentId: string, fileId: string): Promise<FileEntity | null> {
  const table = getFilesTable();
  try {
    const entity = await table.getEntity(componentId, fileId);
    return entity as unknown as FileEntity;
  } catch (e: any) {
    if (e.statusCode === 404) return null;
    throw e;
  }
}

export async function deleteFilesByComponentId(componentId: string): Promise<FileEntity[]> {
  const table = getFilesTable();
  const files = await getFilesByComponentId(componentId);
  for (const f of files) {
    await table.deleteEntity(componentId, f.rowKey);
  }
  return files;
}
