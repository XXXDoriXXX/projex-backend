import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';
// ----- КОНФІГУРАЦІЯ -----
var BASE_URL = 'http://localhost:3000/api/project';
var PROJECT_ID = 'cmh3596e10001c67clceobdb8'; // Ваш дійсний Project ID
// Ваш тестовий токен (Bearer Token).
// У реальному тестуванні його краще отримувати через окремий запит login.
var AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWYxNnI4aXkwMDAwYzY0c2RxYmZtYjMwIiwidXNlcm5hbWUiOiJUZXN0IiwiaWF0IjoxNzYxMjQ5MzM0LCJleHAiOjE3NjEyNTI5MzR9.C2hf3buiO5x6oB0LVrZO0Vk9QYYi7u2sHNusNfUJZ3A';
// -----------------------
// Кастомна метрика для відстеження успішних завантажень
var fileUploads = new Counter('file_uploads');
export var options = {
    stages: [
        { duration: '10s', target: 5 }, // Знижуємо навантаження для безпеки, оскільки це I/O операція
        { duration: '1m', target: 15 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<10000'], // Збільшуємо поріг через I/O та обробку медіа
        'http_req_failed': ['rate < 0.05'], // Допускаємо трохи більший рівень помилок
        'file_uploads': ['count > 0'],
    },
};
// ЗАГЛУШКА: функція для створення бінарних даних файлу
var binFile = open('./test-image.png', 'b');
export default function () {
    var payload = {
        // http.file() тепер використовує реальні бінарні дані
        'file': http.file(binFile, 'test-image.png', 'image/png'),
    };
    // 3. Заголовки (Content-Type та Автентифікація)
    var params = {
        headers: {
            'Authorization': "Bearer ".concat(AUTH_TOKEN),
        },
        // k6 автоматично встановлює Content-Type: multipart/form-data
        // завдяки передачі об'єкта 'file' у payload
    };
    // 4. Виконання POST-запиту
    var res = http.post("".concat(BASE_URL, "/media/upload"), payload, params);
    // 5. Перевірка результату
    var success = check(res, {
        'is status 201': function (r) { return r.status === 201; },
        'has media ID': function (r) { return r.json() && r.json().data && r.json().data.id.length > 5; },
    });
    if (success) {
        fileUploads.add(1);
    }
    else {
        console.error("[Error] Status: ".concat(res.status, ", Body: ").concat(res.body));
    }
    sleep(1);
}
