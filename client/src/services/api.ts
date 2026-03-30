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
  author_email: string;
  created_at: string;
  thumbnail: string | null;
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

export async function fetchComponents(
  search: string = '',
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<ComponentSummary>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
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

export async function deleteComponent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    await throwApiError(res, 'Delete failed');
  }
}
