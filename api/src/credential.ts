import { AccessToken, TokenCredential, GetTokenOptions } from '@azure/core-auth';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Custom credential that tries the SWA/App Service managed identity endpoint
 * first (works around @azure/identity parsing issues in SWA managed API),
 * then falls back to DefaultAzureCredential for local dev.
 */
class SwaIdentityCredential implements TokenCredential {
  private cache: Map<string, { token: AccessToken }> = new Map();
  private fallback = new DefaultAzureCredential();

  async getToken(scopes: string | string[], _options?: GetTokenOptions): Promise<AccessToken> {
    const scope = Array.isArray(scopes) ? scopes[0] : scopes;
    // Strip trailing /.default if present to get the resource
    const resource = scope.replace(/\/.default$/, '');

    // Check cache
    const cached = this.cache.get(resource);
    if (cached && cached.token.expiresOnTimestamp > Date.now() + 60_000) {
      return cached.token;
    }

    const endpoint = process.env.IDENTITY_ENDPOINT;
    const header = process.env.IDENTITY_HEADER;

    if (endpoint && header) {
      try {
        const url = `${endpoint}?resource=${encodeURIComponent(resource)}&api-version=2019-08-01`;
        const resp = await fetch(url, {
          headers: { 'X-IDENTITY-HEADER': header },
        });
        if (!resp.ok) {
          throw new Error(`MSI endpoint returned ${resp.status}: ${await resp.text()}`);
        }
        const body = await resp.json() as { access_token: string; expires_on: string | number };
        const expiresOn = typeof body.expires_on === 'string'
          ? (body.expires_on.includes('T')
            ? new Date(body.expires_on).getTime()
            : Number(body.expires_on) * 1000)
          : Number(body.expires_on) * 1000;

        const token: AccessToken = {
          token: body.access_token,
          expiresOnTimestamp: expiresOn,
        };
        this.cache.set(resource, { token });
        return token;
      } catch (e) {
        console.warn('SwaIdentityCredential: MSI endpoint failed, falling back to DefaultAzureCredential', e);
      }
    }

    return this.fallback.getToken(scopes, _options);
  }
}

export const credential: TokenCredential = new SwaIdentityCredential();
