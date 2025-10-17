import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { injectable } from 'tsyringe';

export interface IAzureBlobService {
    upload(blobName: string, buffer: Buffer, mimeType: string): Promise<string>;
    delete(blobName: string): Promise<void>;
}

@injectable()
export class AzureBlobService implements IAzureBlobService {
    private readonly containerClient: ContainerClient;

    constructor() {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'media';

        if (!connectionString) {
            throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set in environment variables');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = blobServiceClient.getContainerClient(containerName);
        this.containerClient.createIfNotExists({ access: 'blob' });
    }

    private getBlobName(originalName: string): string {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        return `${uniqueSuffix}-${originalName}`;
    }

    async upload(originalName: string, buffer: Buffer, mimeType: string): Promise<string> {
        const blobName = this.getBlobName(originalName);
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: mimeType }
        });

        return blockBlobClient.url;
    }

    async delete(blobUrl: string): Promise<void> {
        const blobName = blobUrl.split('/').pop();
        if (!blobName) {
            console.error("Could not extract blob name from URL:", blobUrl);
            return;
        }
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
    }
}