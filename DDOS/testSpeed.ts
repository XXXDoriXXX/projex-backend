import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = 'http://localhost:3000/api/';
const PROJECT_ID = 'cmh3596e10001c67clceobdb8';

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWd6aWMxcngwMDAwYzYzd25nazg5YWE2IiwidXNlcm5hbWUiOiJNZW93IiwiaWF0IjoxNzYyMzQzOTg2LCJleHAiOjE3NjI0MzAzODZ9.8ha25CTaE9MST5R0s3EikGeCk6eVKzMVmNYf0MALjGc';

const fileUploads = new Counter('file_uploads');

export const options = {
    stages: [
        { duration: '10s', target: 5 },
        { duration: '1m', target: 15 },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<10000'],
        'http_req_failed': ['rate < 0.05'],
        'file_uploads': ['count > 0'],
    },
};


const binFile = open('./test-image.png', 'b');
export default function () {

    const payload = {
        'file': http.file(binFile, 'test-image.png', 'image/png'),
    };

    const params = {
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
    };


    const res = http.get(`${BASE_URL}hackathon/cmh9j9fcs0005c6s4kr2x4jau`, );

    const success = check(res, {
        'is status 201': (r) => r.status === 200,
    });

    if (success) {
        fileUploads.add(1);
    } else {
        console.error(`[Error] Status: ${res.status}, Body: ${res.body}`);
    }

    sleep(1);
}