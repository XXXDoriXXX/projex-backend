import express from 'express';
import request from 'supertest';
import { updateProject} from '../project.controller';
import jwt from 'jsonwebtoken';
import { authenticate } from "../../middleware/auth";
import { validateProject } from "../../middleware/project/validateProject";


const JWT_SECRET = process.env.JWT_SECRET || 'MeowMeowMeow';

const testToken = jwt.sign(
    { userId: 'cmf16r8iy0000c64sdqbfmb30', username: 'Test' },
    JWT_SECRET,
    { expiresIn: '1h' }
);
const notValidtestToken = jwt.sign(
    { userId: 'cmfc9n2l70000c6g0i1wd6t4u', username: 'Test' },
    JWT_SECRET,
    { expiresIn: '1h' }
);


const app = express();
app.use(express.json());
app.put('/api/project/:id', validateProject, authenticate, updateProject);
const randomname = Math.random().toString(36).substring(7);

describe('PUT /api/project/:id', () => {
    it('should update a new project', async () => {
        const res = await request(app)
            .put('/api/project/cmfc7vmix0001c6ro0qyansli')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: `${randomname}`,
                description: "This is a test project"
            });
        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe(`${randomname}`);
        expect(res.body.description).toBe("This is a test project");
    });
    it('should update error project', async () => {
        const res = await request(app)
            .put('/api/project/cmf1e5bu50001c62s84jw0nq7')
            .set('Authorization', `Bearer ${notValidtestToken}`)
            .send({
                title: "Test Project3",
                description: "This is a test project"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("You do not have permission to update this project");

    });
    it('should update error project', async () => {
        const res = await request(app)
            .put('/api/project/cmf1e5bu50001c62s84jw0n7')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: "Test Project3",
                description: "This is a test project"
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Project not found");

    });
    it('should update error new project', async () => {
        const res = await request(app)
            .put('/api/project/cmfc7vmix0001c6ro0qyansli')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: `${randomname}`,
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Title and description are required");
    });
    it('should update project', async () => {
        const res = await request(app)
            .put('/api/project/cmfc7vmix0001c6ro0qyansli')
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                title: `${randomname}`,
                description: "This is a test project",
                githubUrl: "https://github.com/ccache/ccache/blob/master/doc/INSTALL.md",
                demoUrl: "https://q23",
                media: [
                    { type: "image", url: "https://q23" }
                ],
                technologies: ["cmf1e3z3e0000c62s8o4z6y5"],


            });
        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();
        expect(res.body.title).toBe(`${randomname}`);
        expect(res.body.description).toBeDefined();
        expect(res.body.technologies).toBeDefined();
        expect(res.body.media).toBeDefined();
        expect(res.body.technologies).toBeDefined();
        expect(res.body.description).toBe("This is a test project");
    });
});