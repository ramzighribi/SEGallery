import { AccessToken, TokenCredential, GetTokenOptions } from '@azure/core-auth';
import { DefaultAzureCredential } from '@azure/identity';

const MSI_RETRIES = 3;
const MSI_RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Custom credential that calls the App Service / Function App managed identity
 * endpoint directly (bypasses @azure/identity "expires_on" parsing bug).
 * Falls back to DefaultAzureCredential ONLY for local development (when
 * IDENTITY_ENDPOINT is not set).
 */
class SwaIdentityCredential implements TokenCredential {
  private cache: Map<string, { token: AccessToken }> = new Map();
  private fallback: DefaultAzureCredential | null = null;

  async getToken(scopes: string | string[], _options?: GetTokenOptions): Promise<AccessToken> {
    const scope = Array.isArray(scopes) ? scopes[0] : scopes;
    const resource = scope.replace(/\/.default$/, '');

    // Check cache
    const cached = this.cache.get(resource);
    if (cached && cached.token.expiresOnTimestamp > Date.now() + 60_000) {
      return cached.token;
    }

    const endpoint = process.env.IDENTITY_ENDPOINT;
    const header = process.env.IDENTITY_HEADER;

    if (endpoint && header) {
      // Production: use MSI endpoint directly with retries
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= MSI_RETRIES; attempt++) {
        try {
          const url = `${endpoint}?resource=${encodeURIComponent(resource)}&api-version=2019-08-01`;
          const resp = await fetch(url, {
            headers: { 'X-IDENTITY-HEADER': header },
          });
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`MSI endpoint returned ${resp.status}: ${text}`);
          }
          const body = await resp.json() as Record<string, unknown>;
          const accessToken = body.access_token as string;
          if (!accessToken) {
            throw new Error(`MSI response missing access_token: ${JSON.stringify(body)}`);
          }
          const rawExpires = body.expires_on;
          let expiresOn: number;
          if (typeof rawExpires === 'string') {
            expiresOn = rawExpires.includes('T')
              ? new Date(rawExpires).getTime()
              : Number(rawExpires) * 1000;
          } else if (typeof rawExpires === 'number') {
            expiresOn = rawExpires * 1000;
          } else {
            // Fallback: expire in 1 hour
            expiresOn = Date.now() + 3600_000;
          }

          const token: AccessToken = { token: accessToken, expiresOnTimestamp: expiresOn };
          this.cache.set(resource, { token });
          return token;
        } catch (e: any) {
          lastError = e;
          console.warn(`SwaIdentityCredential: MSI attempt ${attempt}/${MSI_RETRIES} failed:`, e.message);
          if (attempt < MSI_RETRIES) await sleep(MSI_RETRY_DELAY_MS * attempt);
        }
      }
      throw lastError || new Error('MSI authentication failed after retries');
    }

    // Local development: use DefaultAzureCredential
    if (!this.fallback) this.fallback = new DefaultAzureCredential();
    return this.fallback.getToken(scopes, _options);
  }
}

export const credential: TokenCredential = new SwaIdentityCredential();
