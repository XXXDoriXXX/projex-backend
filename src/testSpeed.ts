import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    stages: [
        // 1. Плавний розгін до 50 користувачів за 30 секунд
        { duration: '30s', target: 50 },

        // 2. Тримаємо 50 користувачів ще 1 хвилину (стабільне навантаження)
        { duration: '1m', target: 50 },

        // 3. Плавний спуск до 0
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        // Встановлюємо "цілі" (порогові значення) для тесту
        'http_req_duration': ['p(95)<500'],// p(95) час відповіді має бути менше 500ms
        'http_req_failed': ['rate < 0.01'],   // Рівень помилок має бути менше 1%
    },
};

export default function () {

    const res = http.get('http://localhost:3000/api/project/get/cmgyz2akx000fc6esd5xdhas2');

    // Перевіряємо, чи відповідь успішна (статус 200)
    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    // Невелика пауза між запитами (імітація реального користувача)
    sleep(1);
}