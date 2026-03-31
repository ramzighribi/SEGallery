const API_BASE = '/api';

export interface ApiErrorDetail {
  error: string;
  message: string;
  stack?: string;
  code?: string;
  timestamp?: string;
  function?: string;
  method?: string;
  url?: string;
  status?: number;
}

export class ApiError extends Error {
  detail: ApiErrorDetail;
  constructor(detail: ApiErrorDetail) {
    super(detail.message || detail.error);
    this.detail = detail;
  }
}

async function throwApiError(res: Response, fallbackMsg: string): Promise<never> {
  let detail: ApiErrorDetail;
  try {
    const body = await res.json();
    detail = { ...body, status: res.status };
  } catch {
    detail = {
      error: fallbackMsg,
      message: `HTTP ${res.status} ${res.statusText}`,
      status: res.status,
    };
  }
  throw new ApiError(detail);
}

export interface ComponentSummary {
  id: string;
  title: string;
  description: string;
  author_name: string;
  created_at: string;
  thumbnail: string | null;
  tags: string[];
  view_count: number;
  download_count: number;
  average_rating: number;
  rating_count: number;
}

export interface ComponentFile {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface ComponentDetail extends ComponentSummary {
  file_name: string;
  author_id: string;
  fileUrl: string;
  screenshots: { id: string; fileName: string; url: string }[];
  files: ComponentFile[];
  user_rating: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function formatAuthorName(name: string): string {
  if (!name) return 'Inconnu';
  // If it looks like an email, extract and format the name part
  if (name.includes('@')) {
    const local = name.split('@')[0];
    // Handle formats like firstname.lastname or firstnamelastname
    return local
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  return name;
}

export async function fetchComponents(
  search: string = '',
  page: number = 1,
  limit: number = 12,
  sort: 'desc' | 'asc' = 'desc',
  tags: string[] = []
): Promise<PaginatedResponse<ComponentSummary>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
  if (search) params.set('search', search);
  if (tags.length > 0) params.set('tags', tags.join(','));

  const res = await fetch(`${API_BASE}/components?${params}`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch components');
  return res.json();
}

export async function fetchComponentById(id: string): Promise<ComponentDetail> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(id)}`);
  if (!res.ok) await throwApiError(res, 'Component not found');
  return res.json();
}

export async function createComponent(formData: FormData): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/components`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res, 'Upload failed');
  }
  return res.json();
}

export async function updateComponent(id: string, formData: FormData): Promise<void> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res, 'Update failed');
  }
}

export async function deleteComponent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    await throwApiError(res, 'Delete failed');
  }
}

export function getDownloadUrl(id: string, fileId?: string): string {
  const base = `${API_BASE}/downloads/${encodeURIComponent(id)}/file`;
  return fileId ? `${base}?fileId=${encodeURIComponent(fileId)}` : base;
}

export async function trackDownload(id: string): Promise<{ download_count: number }> {
  const res = await fetch(`${API_BASE}/downloads/${encodeURIComponent(id)}`, {
    method: 'POST',
  });
  if (!res.ok) await throwApiError(res, 'Failed to track download');
  return res.json();
}

export async function rateComponent(id: string, rating: number): Promise<{ average_rating: number; rating_count: number }> {
  const res = await fetch(`${API_BASE}/ratings/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to rate component');
  return res.json();
}

// --- Tags constants ---

export const SECTOR_TAGS = [
  'Services financiers',
  'Distribution',
  'Secteur public',
  'Santé',
  'Énergie',
  'Industrie',
  'Éducation',
  'Autre secteur',
];

export const TABLE_TAGS = [
  'Compte',
  'Contact',
  'Incident',
  'Activités',
  'Opportunité',
  'Prospect',
  'Conversation',
  'Autre table',
];

export const ALL_TAGS = [...SECTOR_TAGS, ...TABLE_TAGS];

// --- Comments ---

export interface Comment {
  id: string;
  author_name: string;
  author_id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export async function fetchComments(componentId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(componentId)}/comments`);
  if (!res.ok) await throwApiError(res, 'Failed to fetch comments');
  return res.json();
}

export async function createComment(componentId: string, text: string): Promise<Comment> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(componentId)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to create comment');
  return res.json();
}

export async function updateCommentApi(componentId: string, commentId: string, text: string): Promise<void> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(componentId)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) await throwApiError(res, 'Failed to update comment');
}

export async function deleteCommentApi(componentId: string, commentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(componentId)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) await throwApiError(res, 'Failed to delete comment');
}
