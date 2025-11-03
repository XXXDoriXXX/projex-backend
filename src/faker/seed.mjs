import axios from 'axios';
import { Faker, uk, en } from '@faker-js/faker';

// Використовуємо українську локаль для Faker
const faker = new Faker({ locale: [uk, en] });

// --- КОНФІГУРАЦІЯ ---
const API_BASE_URL = 'http://localhost:3000/api/hackathon'; // Вкажіть правильний порт і шлях
const NUMBER_TO_CREATE = 100;

// 🚨 ЗАМІНІТЬ ЦЕЙ ТОКЕН НА НОВИЙ!
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWd6aWMxcngwMDAwYzYzd25nazg5YWE2IiwidXNlcm5hbWUiOiJNZW93IiwiaWF0IjoxNzYxNzY5MTY3LCJleHAiOjE3NjE4NTU1Njd9.SZaL75hHkKC_mFr9Jp7cX2ku5pKxow2FtLpxtim99G8';

// Налаштування екземпляра axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
    }
});

/**
 * Генерує об'єкт DTO для створення хакатону.
 * Статуси ('UPCOMING', 'OPEN', 'CLOSED') будуть неявно визначені
 * вашим бекендом на основі цих дат.
 */
function createRandomHackathonDto() {
    // 1. Випадково генеруємо дати
    const startDate = faker.date.between({
        from: '2024-01-01T00:00:00.000Z',
        to: '2026-12-31T00:00:00.000Z'
    });

    const endDate = faker.date.future({ days: 14, refDate: startDate }); // 0-14 днів після startDate

    // 2. Створюємо DTO
    return {
        title: `${faker.commerce.productName()} Hackathon #${faker.number.int({ min: 1, max: 5000 })}`,
        description: faker.lorem.paragraphs(2),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        allowParticipantRating: faker.datatype.boolean(),
        allowPublicRating: faker.datatype.boolean(),
        // Додайте judgeIds, themeIds тощо, якщо вони є обов'язковими
        // judgeIds: [],
        // themeIds: [],
    };
}

/**
 * Функція-помічник для невеликої затримки між запитами,
 * щоб не перевантажити ваш dev-сервер.
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Головна функція сідера
 */
async function seedHackathons() {
    console.log(`🚀 Починаємо генерацію ${NUMBER_TO_CREATE} хакатонів...`);

    for (let i = 1; i <= NUMBER_TO_CREATE; i++) {
        const dto = createRandomHackathonDto();

        try {
            const response = await apiClient.post('/', dto);
            console.log(`[${i}/${NUMBER_TO_CREATE}] ✅ Створено: ${dto.title.substring(0, 40)}...`);

            await delay(50);

        } catch (error) {
            console.error(`[${i}/${NUMBER_TO_CREATE}] ❌ Помилка при створенні: ${dto.title}`);
            if (error.response) {
                console.error('   Відповідь сервера:', error.response.data);
            } else {
                console.error('   Помилка:', error.message);
            }
        }
    }

    console.log('🎉 Генерацію завершено!');
}

seedHackathons();