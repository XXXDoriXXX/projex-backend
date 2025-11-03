import 'reflect-metadata';
import './di/projectContainer';
import './di/authContainer';
import'./di/userContainer'
import './di/hackathonContainer';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import statusRoute from './routes/status.route';
import authRoute from './routes/auth.route';
import projectRoute from './routes/project.route';
import hackathonRoute from './routes/hackathon.route';

import { requestId } from './middleware/request-id';
import { httpLogger } from './middleware/http-logger';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './errors/CustomErrors';
import userRoute from "./routes/user.route";

function parseAllowedOrigins(envValue?: string): string[] {
    if (!envValue) return [];
    return envValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((o) => {
            try {
                const u = new URL(o);
                return u.protocol === 'http:' || u.protocol === 'https:';
            } catch {
                return false;
            }
        });
}

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://projex-frontend-hazel.vercel.app'
];


const envOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

const allowList = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions: cors.CorsOptions = {
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowList.includes(origin)) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
};

const app = express();

app.use(requestId);
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));
app.use(httpLogger);

app.use('/api/status', statusRoute);
app.use('/api/auth', authRoute);
app.use('/api/project', projectRoute);
app.use('/api/user',userRoute)
app.use('/api/hackathon', hackathonRoute);

app.get('/', (_req, res) => {
    res.json({ message: 'Projex API is running!' });
});

app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl}`));
});

app.use(errorHandler);

export default app;
