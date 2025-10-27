import { inject, injectable } from 'tsyringe';
import { Worker } from 'worker_threads';
import path from 'path';
import { ProjectMedia, MediaType } from '@prisma/client';
import { type IProjectMediaRepository } from '../repositories/project.media.repository';
import { type IAzureBlobService } from './azure.blob.service';
import { ValidationError, AppError } from '../errors/CustomErrors';
import {ForbiddenError, NotFoundError} from "routing-controllers";
import {fileURLToPath} from "node:url";
import { Readable } from 'stream';
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
export interface IProjectServiceMedia {
    uploadMedia(userId: string, file: { buffer: Buffer, mimetype: string, originalname: string }): Promise<ProjectMedia>;
    deleteMedia(mediaId: string, userId: string): Promise<void>;
}
const MAX_IMAGE_SIZE_MB = 50; // 50 MB для зображень
const MAX_VIDEO_SIZE_MB = 1024; // 1 GB для відео
const MAX_VIDEO_DURATION_SEC = 180; // 3 хвилини
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
    private async getVideoDuration(fileBuffer: Buffer): Promise<number> {

        const readableStream = Readable.from(fileBuffer);

        try {

            return new Promise<number>((resolve, reject) => {
                ffmpeg(readableStream).ffprobe((err, metadata) => {
                    if (err) {
                        return reject(new Error(`ffprobe error: ${err.message}`));
                    }

                    const duration = metadata.format.duration;
                    if (duration === undefined) {
                        return reject(new Error('Could not read video duration.'));
                    }
                    resolve(duration);
                });
            });
        } catch (error:any) {
            console.error(`[Service] Failed to probe video stream: ${error.message}`);

            throw new AppError(`Failed to probe video file: ${error.message}`);
        }
    }
    async uploadMedia(userId: string, file: { buffer: Buffer, mimetype: string, originalname: string }): Promise<ProjectMedia> {
        let mediaType: MediaType;
        const fileSizeInMB = file.buffer.length / (1024 * 1024);
        if (file.mimetype.startsWith('image/')) {
            if (fileSizeInMB > MAX_IMAGE_SIZE_MB) {
                throw new ValidationError(`Image file is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`, 'file');
            }
            mediaType = MediaType.image;
        } else if (file.mimetype.startsWith('video/')) {
            if (fileSizeInMB > MAX_VIDEO_SIZE_MB) {
                throw new ValidationError(`Video file is too large. Max size is ${MAX_VIDEO_SIZE_MB}MB.`, 'file');
            }
            try {
                const duration = await this.getVideoDuration(file.buffer);
                if (duration > MAX_VIDEO_DURATION_SEC) {
                    const durationInMin = Math.round(MAX_VIDEO_DURATION_SEC / 60);
                    throw new ValidationError(`Video is too long. Max duration is ${durationInMin} minutes.`, 'file');
                }
            } catch (error:any) {
                console.error(`Video validation error: ${error.message}`);
                throw new ValidationError(`Could not validate video file. It may be corrupt or in an unsupported format. ${error.message}`, 'file');
            }
            mediaType = MediaType.video;
        } else {
            throw new ValidationError('Unsupported file type', 'file');
        }

        // обробка файлу в потоці
        const processedBuffer = await this.runMediaWorker(file.buffer, file.mimetype);

        // аплоад в Azure
        const url = await this.azureService.upload(file.originalname, processedBuffer, file.mimetype);

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

        // чистимо в Azure
        await this.azureService.delete(media.url);

        // видаляємо з БД
        await this.mediaRepo.deleteMedia(mediaId);
    }
}