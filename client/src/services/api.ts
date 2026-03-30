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
  view_count: number;
  download_count: number;
  average_rating: number;
  rating_count: number;
}

export interface ComponentDetail extends ComponentSummary {
  file_name: string;
  author_id: string;
  fileUrl: string;
  screenshots: { id: string; fileName: string; url: string }[];
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
  sort: 'desc' | 'asc' = 'desc'
): Promise<PaginatedResponse<ComponentSummary>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
  if (search) params.set('search', search);

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

export function getDownloadUrl(id: string): string {
  return `${API_BASE}/downloads/${encodeURIComponent(id)}/file`;
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
