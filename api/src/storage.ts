import { BlobServiceClient, BlobSASPermissions, SASProtocol, generateBlobSASQueryParameters, UserDelegationKey } from '@azure/storage-blob';
import { credential } from './credential';

let blobServiceClient: BlobServiceClient | null = null;

function getAccountName(): string {
  const name = process.env.STORAGE_ACCOUNT_NAME;
  if (!name) throw new Error('STORAGE_ACCOUNT_NAME is not set');
  return name;
}

function getClient(): BlobServiceClient {
  if (blobServiceClient) return blobServiceClient;
  blobServiceClient = new BlobServiceClient(
    `https://${getAccountName()}.blob.core.windows.net`,
    credential
  );
  return blobServiceClient;
}

export async function uploadBlob(
  containerName: string,
  blobName: string,
  content: Buffer,
  contentType: string
): Promise<string> {
  const client = getClient();
  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}

export async function deleteBlob(containerName: string, blobName: string): Promise<void> {
  const client = getClient();
  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

export async function downloadBlobBuffer(containerName: string, blobName: string): Promise<Buffer> {
  const client = getClient();
  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  return blockBlobClient.downloadToBuffer();
}

// Cache user delegation key (valid 1h, refreshed every 50min)
let cachedUDK: { key: UserDelegationKey; expiresOn: Date } | null = null;

async function getUserDelegationKey(): Promise<UserDelegationKey> {
  const now = new Date();
  if (cachedUDK && cachedUDK.expiresOn > now) return cachedUDK.key;

  const client = getClient();
  const startsOn = new Date();
  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + 1);

  const udk = await client.getUserDelegationKey(startsOn, expiresOn);
  // Refresh 10 min before expiry
  const cacheExpiry = new Date(expiresOn.getTime() - 10 * 60 * 1000);
  cachedUDK = { key: udk, expiresOn: cacheExpiry };
  return udk;
}

export async function generateReadSasUrl(blobUrl: string): Promise<string> {
  const accountName = getAccountName();

  const url = new URL(blobUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const containerName = pathParts[0];
  const blobName = pathParts.slice(1).join('/');

  const udk = await getUserDelegationKey();

  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + 1);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(),
      expiresOn,
      protocol: SASProtocol.Https,
    },
    udk,
    accountName
  ).toString();

  return `${blobUrl}?${sasToken}`;
}
