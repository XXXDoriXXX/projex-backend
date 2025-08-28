import express from 'express';
import request from 'supertest';
import { createProject } from '../project.controller';
import jwt from 'jsonwebtoken';
import { authenticate } from "../../middleware/auth";
import { validateProject } from "../../middleware/project/validateProject";

const JWT_SECRET = process.env.JWT_SECRET || 'MeowMeowMeow';

const testToken = jwt.sign(
    { userId: 'cmevm6dso0000c6x4hdp01m93', username: 'Dehimik' },
    JWT_SECRET,
    { expiresIn: '1h' }
);

const app = express();
app.use(express.json());
app.post('/api/project/create', validateProject, authenticate, createProject);

describe('POST /api/project/create', () => {
    it('should create a new project', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Test Project2",
                description: "This is a test project"
            });
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe("Test Project2");
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

    it('should return 400 if title is too short', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Te",
                description: "This is a test project"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Title must be at least 3 characters");
    });

    it('should return 400 if title is too long', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "A".repeat(51),
                description: "This is a test project"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Title length exceeds 50 characters");
    });

    it('should return 400 if description is too short', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "short"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Description must be at least 10 characters");
    });

    it('should return 400 if description is too long', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "A".repeat(501)
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Description length exceeds 500 characters");
    });

    it('should return 400 if githubUrl is invalid', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                githubUrl: "not a url"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("GitHub URL is invalid");
    });

    it('should return 400 if githubUrl is not a github link', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                githubUrl: "https://google.com"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("GitHub URL must be a GitHub link");
    });

    it('should return 400 if demoUrl is invalid', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                demoUrl: "not a url"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Demo URL is invalid");
    });

    it('should return 400 if media is not an array', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                media: "not-an-array"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Media must be an array");
    });

    it('should return 400 if media contains invalid type', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                media: [{ type: "audio", url: "https://example.com/img.png" }]
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid media type");
    });

    it('should return 400 if technologies is not an array', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                technologies: "not-an-array"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Technologies must be an array");
    });

    it('should return 400 if technologies contains empty string', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                technologies: [""]
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Technology ID must be a non-empty string");
    });

    it('should return 400 if media contains duplicate URLs', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                media: [
                    { type: "image", url: "https://example.com/img.png" },
                    { type: "image", url: "https://example.com/img.png" }
                ]
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Duplicate media URLs not allowed");
    });

    it('should return 400 if technologies contains duplicate IDs', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                technologies: ["react", "react"]
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Duplicate technology IDs not allowed");
    });

    it('should return 400 if userId is missing (simulate by tampered token)', async () => {
        const tamperedToken = jwt.sign(
            { username: 'Dehimik' }, // no userId
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${tamperedToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project"
            });
        expect(res.status).toBe(403);
    });

    it('should return 400 if media array is too large', async () => {
        const mediaArr = Array(11).fill({ type: "image", url: "https://example.com/img.png" });
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                media: mediaArr
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Maximum 10 media items allowed");
    });

    it('should return 400 if technologies array is too large', async () => {
        const techArr = Array(16).fill("react");
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Good Title",
                description: "This is a test project",
                technologies: techArr
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Maximum 15 technologies allowed");
    });

    it('should return 400 if title contains invalid characters', async () => {
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Bad@Title!",
                description: "This is a test project"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Title contains invalid characters");
    });

    // Додавай ще кейси за потреби: наприклад, унікальність назви (створити двічі)
    it('should return 400 if project title is not unique per user', async () => {
        // 1. create project
        await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "UniqueTitle",
                description: "This is a test project"
            });
        // 2. create same project title again for same user
        const res = await request(app)
            .post('/api/project/create')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "UniqueTitle",
                description: "This is another test project"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Project title must be unique per user");
    });

});