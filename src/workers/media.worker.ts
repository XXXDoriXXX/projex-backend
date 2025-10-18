import { parentPort, workerData } from 'worker_threads';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

async function processMedia(fileBuffer: Buffer, mimeType: string): Promise<Buffer> {
    console.log(`[Worker] Processing ${mimeType}...`);
    //ресайз і компресія зображень,
    if (mimeType.startsWith('image/')) {

        return sharp(fileBuffer)
            .resize(1920, null, { withoutEnlargement: true })
            .jpeg({ quality: 75, progressive: true })
            .toBuffer();
    }
    //транскодування відео
    if (mimeType.startsWith('video/')) {

        const tempDir = os.tmpdir();//тимчасова директорія
        const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const inputPath = path.join(tempDir, `input_${uniqueId}`);
        const outputPath = path.join(tempDir, `output_${uniqueId}.mp4`);

        try {
            await fs.writeFile(inputPath, fileBuffer);//робимо тимчасовий вхідний файл
            console.log(`[Worker] Temp input file created: ${inputPath}`);

            await new Promise<void>((resolve, reject) => {
                ffmpeg(inputPath)
                    .videoCodec('libx264')//H.264
                    .audioCodec('aac')// AAC - Audio
                    .videoBitrate('1000k') //1Mbps
                    .audioBitrate('128k') // 128kbps
                    .size('?x720') //макс висота 720p
                    .outputOptions([
                        '-preset fast', // швидка компресія
                        '-movflags faststart'// оптимізація для стрімінгу
                    ])
                    .toFormat('mp4')
                    .on('start', (cmd) => console.log(`[Worker] ffmpeg command: ${cmd}`))
                    .on('error', (err) => {
                        console.error('[Worker] ffmpeg error:', err.message);
                        reject(new Error(`ffmpeg processing failed: ${err.message}`));
                    })
                    .on('end', () => {
                        console.log(`[Worker] ffmpeg processing finished: ${outputPath}`);
                        resolve();
                    })
                    .save(outputPath);
            });
            const processedBuffer = await fs.readFile(outputPath);
            console.log(`[Worker] Processed file read back into buffer.`);
            return processedBuffer;

        } catch (error) {
            console.error('[Worker] Video processing block failed:', error);
            throw error;
        } finally {
            try {
                await fs.unlink(inputPath);
                await fs.unlink(outputPath);
                console.log(`[Worker] Temp files cleaned up.`);
            } catch (cleanupError:any) {
                console.warn(`[Worker] Failed to cleanup temp files: ${cleanupError.message}`);
            }
        }
        }

    return fileBuffer;
}


(async () => {
    if (!parentPort) return;

    try {
        const { fileBuffer, mimeType } = workerData;
        const processedBuffer = await processMedia(Buffer.from(fileBuffer), mimeType);
        parentPort.postMessage({ success: true, buffer: processedBuffer });
    } catch (error:any) {
        parentPort.postMessage({ success: false, error: error.message });
    }
})();