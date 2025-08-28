import express from 'express';
import request from 'supertest';
import { createProject } from '../project.controller';
import jwt from 'jsonwebtoken';
import {authenticate} from "../../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || 'MeowMeowMeow';

const testToken = jwt.sign(
    { userId: 'cmevm6dso0000c6x4hdp01m93', username: 'Dehimik' },
    JWT_SECRET,
    { expiresIn: '1h' }
);


const app = express();

app.use(express.json());
app.post('/api/project/create', authenticate, createProject);
describe('POST /api/project/create', () => {
    it('should create a new project', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Test Project",
                description: "This is a test project"
            });
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe("Test Project");
        expect(res.body.description).toBe("This is a test project");
    });

    it('should return 400 if title or description is missing', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Title and description are required");
    });
    it('should return 401 if no token is provided', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .send({
                title: "Test Project",
                description: "This is a test project"
            });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Unauthorized");
    });

});