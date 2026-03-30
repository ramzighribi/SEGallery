// Azure Static Web Apps built-in auth — no MSAL needed
export interface SwaUser {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
  claims: { typ: string; val: string }[];
}

export interface AuthInfo {
  clientPrincipal: SwaUser | null;
}

export async function getAuthInfo(): Promise<AuthInfo> {
  try {
    const res = await fetch('/.auth/me');
    if (!res.ok) return { clientPrincipal: null };
    const data = await res.json();
    return data;
  } catch {
    return { clientPrincipal: null };
  }
}

export function getUserDisplayName(user: SwaUser): string {
  const nameClaim = user.claims?.find(
    (c) => c.typ === 'name' || c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
  );
  return nameClaim?.val || user.userDetails || 'Utilisateur';
}

export function getUserEmail(user: SwaUser): string {
  const emailClaim = user.claims?.find(
    (c) =>
      c.typ === 'preferred_username' ||
      c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  );
  return emailClaim?.val || user.userDetails || '';
}

export function loginUrl(): string {
  return '/.auth/login/aad?post_login_redirect_uri=' + encodeURIComponent(window.location.pathname);
}

export function logoutUrl(): string {
  return '/.auth/logout?post_logout_redirect_uri=/';
}
