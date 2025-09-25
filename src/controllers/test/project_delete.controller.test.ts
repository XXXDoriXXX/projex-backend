import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/auth';
import { deleteProject } from '../project.controller';

jest.mock('../../services/auth.service', () => ({
    deleteProject: jest.fn().mockResolvedValue({
        id: 'cmf1e5cwa0003c62s8b52zde3',
        title: 'Test Project2',
        description: 'This is a test project',
    }),
}));

const JWT_SECRET = process.env.JWT_SECRET || 'MeowMeowMeow';

const testToken = jwt.sign({ userId: 'cmf16r8iy0000c64sdqbfmb30', username: 'Test' }, JWT_SECRET, { expiresIn: '1h' });

const app = express();
app.use(express.json());
app.delete('/api/project/:id', authenticate, deleteProject);

describe('DELETE /api/project/:id', () => {
    it('should delete a project and return the deleted project', async () => {
        const res = await request(app).delete('/api/project/cmf1e5cwa0003c62s8b52zde3').set('Authorization', `Bearer ${testToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('cmf1e5cwa0003c62s8b52zde3');
        expect(res.body.title).toBe('Test Project2');
        expect(res.body.description).toBe('This is a test project');
    });

    it('should return 404 if project not found', async () => {
        const mockService = require('../../services/auth.service');
        mockService.deleteProject.mockRejectedValueOnce(new Error('Project not found'));

        const res = await request(app).delete('/api/project/missing123').set('Authorization', `Bearer ${testToken}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Project not found');
    });

    it('should return 403 if unauthorized', async () => {
        const mockService = require('../../services/auth.service');
        mockService.deleteProject.mockRejectedValueOnce(new Error('Unauthorized'));

        const res = await request(app).delete('/api/project/cmf1e5cwa0003c62s8b52zde3').set('Authorization', `Bearer ${testToken}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Forbidden');
    });
});
