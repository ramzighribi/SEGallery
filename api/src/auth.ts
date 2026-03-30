import { HttpRequest } from '@azure/functions';

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
  claims: { typ: string; val: string }[];
}

export function getUser(req: HttpRequest): ClientPrincipal | null {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return null;

  try {
    const buffer = Buffer.from(header, 'base64');
    const principal: ClientPrincipal = JSON.parse(buffer.toString('utf-8'));
    return principal;
  } catch {
    return null;
  }
}

export function getUserName(principal: ClientPrincipal): string {
  const nameClaim = principal.claims?.find(
    (c) => c.typ === 'name' || c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
  );
  return nameClaim?.val || principal.userDetails || 'Unknown';
}

export function getUserEmail(principal: ClientPrincipal): string {
  const emailClaim = principal.claims?.find(
    (c) =>
      c.typ === 'preferred_username' ||
      c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  );
  return emailClaim?.val || principal.userDetails || '';
}
