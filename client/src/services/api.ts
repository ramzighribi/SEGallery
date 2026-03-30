const API_BASE = '/api';

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
  if (!res.ok) throw new Error('Failed to fetch components');
  return res.json();
}

export async function fetchComponentById(id: string): Promise<ComponentDetail> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Component not found');
  return res.json();
}

export async function createComponent(formData: FormData): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/components`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function deleteComponent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/components/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(err.error || 'Delete failed');
  }
}
