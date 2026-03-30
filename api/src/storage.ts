import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential, SASProtocol } from '@azure/storage-blob';

let blobServiceClient: BlobServiceClient | null = null;

function getClient(): BlobServiceClient {
  if (blobServiceClient) return blobServiceClient;

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
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

export function generateReadSasUrl(blobUrl: string): string {
  // Parse connection string to get account name and key
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
  const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
  const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);

  if (!accountNameMatch || !accountKeyMatch) {
    // Fallback: return raw URL (works for dev storage or public access)
    return blobUrl;
  }

  const accountName = accountNameMatch[1];
  const accountKey = accountKeyMatch[1];
  const credential = new StorageSharedKeyCredential(accountName, accountKey);

  // Parse the container and blob name from the URL
  const url = new URL(blobUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const containerName = pathParts[0];
  const blobName = pathParts.slice(1).join('/');

  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + 1); // 1-hour SAS

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(),
      expiresOn,
      protocol: SASProtocol.Https,
    },
    credential
  ).toString();

  return `${blobUrl}?${sasToken}`;
}
