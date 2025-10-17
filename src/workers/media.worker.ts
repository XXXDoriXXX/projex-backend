import { parentPort, workerData } from 'worker_threads';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import stream from 'stream';

// Ця функція буде симулювати обробку, реальну логіку треба додати
async function processMedia(fileBuffer: Buffer, mimeType: string): Promise<Buffer> {
    console.log(`[Worker] Processing ${mimeType}...`);

    if (mimeType.startsWith('image/')) {
        // Зменшуємо зображення до HD (1920px по ширині), зберігаючи пропорції
        return sharp(fileBuffer)
            .resize(1920, null, { withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();
    }

    if (mimeType.startsWith('video/')) {
        // Для відео це складніше, тут приклад концепції
        // Потрібно буде зберігати файл на диск, обробляти і зчитувати назад
        console.warn('[Worker] Video processing is complex and requires ffmpeg installed on the system.');
        // Тут буде логіка конвертації відео до HD з меншим бітрейтом
        return fileBuffer; // Поки що повертаємо як є
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