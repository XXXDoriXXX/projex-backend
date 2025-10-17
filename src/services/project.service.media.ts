import { inject, injectable } from 'tsyringe';
import { Worker } from 'worker_threads';
import path from 'path';
import { ProjectMedia, MediaType } from '@prisma/client';
import { type IProjectMediaRepository } from '../repositories/project.media.repository';
import { type IAzureBlobService } from './azure.blob.service';
import { ValidationError, AppError } from '../errors/CustomErrors';
import {ForbiddenError, NotFoundError} from "routing-controllers";
import {fileURLToPath} from "node:url";

export interface IProjectServiceMedia {
    uploadMedia(userId: string, file: { buffer: Buffer, mimetype: string, originalname: string }): Promise<ProjectMedia>;
    deleteMedia(mediaId: string, userId: string): Promise<void>;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
@injectable()
export class ProjectServiceMedia implements IProjectServiceMedia {
    constructor(
        @inject('IProjectMediaRepository') private mediaRepo: IProjectMediaRepository,
        @inject('IAzureBlobService') private azureService: IAzureBlobService,
    ) {}

    private runMediaWorker(fileBuffer: Buffer, mimetype: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const workerPath = path.resolve(__dirname, '../workers/media.worker.ts');

            const worker = new Worker(workerPath, {
                workerData: {
                    fileBuffer,
                    mimeType: mimetype,
                },
                execArgv: [
                    '--loader',
                    'ts-node/esm'
                ],
            });

            worker.on('message', (result) => {
                if (result.success) {
                    resolve(Buffer.from(result.buffer));
                } else {
                    reject(new AppError(`Media processing failed: ${result.error}`));
                }
            });

            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new AppError(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }

    async uploadMedia(userId: string, file: { buffer: Buffer, mimetype: string, originalname: string }): Promise<ProjectMedia> {
        let mediaType: MediaType;
        if (file.mimetype.startsWith('image/')) {
            mediaType = MediaType.image;
        } else if (file.mimetype.startsWith('video/')) {
            mediaType = MediaType.video;
        } else {
            throw new ValidationError('Unsupported file type', 'file');
        }

        // 1. Обробляємо файл у воркері
        const processedBuffer = await this.runMediaWorker(file.buffer, file.mimetype);

        // 2. Завантажуємо в Azure
        const url = await this.azureService.upload(file.originalname, processedBuffer, file.mimetype);

        // 3. Зберігаємо запис в БД зі статусом PENDING
        return this.mediaRepo.createMedia(userId, mediaType, url);
    }

    async deleteMedia(mediaId: string, userId: string): Promise<void> {
        const media = await this.mediaRepo.getMediaById(mediaId);

        if (!media) {
            throw new NotFoundError(`Media ${mediaId}`);
        }
        if (media.userId !== userId) {
            throw new ForbiddenError('You do not have permission to delete this media');
        }
        if (media.status === 'ATTACHED') {
            throw new ValidationError('Cannot delete media that is already attached to a project', 'mediaId');
        }

        // 1. Видаляємо файл з Azure
        await this.azureService.delete(media.url);

        // 2. Видаляємо запис з БД
        await this.mediaRepo.deleteMedia(mediaId);
    }
}