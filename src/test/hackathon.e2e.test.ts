jest.mock('../services/project.service.media', () => {

    return {
        ProjectServiceMedia: class MockProjectServiceMedia {

            uploadMedia = jest.fn();
            deleteMedia = jest.fn();
        },
    };
});
jest.mock('../services/azure.blob.service', () => {
    return {
        AzureBlobService: class MockAzureBlobService {},
    };
});
import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';

const AUTHOR = {
    id: 'cmgzic1rx0000c63wngk89aa6',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWd6aWMxcngwMDAwYzYzd25nazg5YWE2IiwidXNlcm5hbWUiOiJNZW93IiwiaWF0IjoxNzYxNTkyNjgyLCJleHAiOjE3NjE1OTYyODJ9.QizUjoJtNAOwrLXuE9tg7_4RfW5N3sf7QI8nNWKQCms', // ОНОВЛЕНО EXP
};

const PARTICIPANT = {
    id: 'cmf16r8iy0000c64sdqbfmb30',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWYxNnI4aXkwMDAwYzY0c2RxYmZtYjMwIiwidXNlcm5hbWUiOiJUZXN0IiwiaWF0IjoxNzYxNTkyNzE4LCJleHAiOjE3NjE1OTYzMTh9.LRVbPjnJrQPQSOEI2krnFpsgAkfAuX6km4uZ4UQGdlk', // ОНОВЛЕНО EXP
};

const JUDGE = {
    id: 'cmh9b3cex0000c6ocks6e5puw',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWg5YjNjZXgwMDAwYzZvY2tzNmU1cHV3IiwidXNlcm5hbWUiOiJzYXNhIiwiaWF0IjoxNzYxNTkyNzQ0LCJleHAiOjE3NjE1OTYzNDR9.GXGntzRDi3x6-yvkYc2YRjZKXFlQgoxp34D4aSTgjsg', // ОНОВЛЕНО EXP
};


describe('Hackathon API E2E Flow', () => {

    let hackathonId: string;
    let ratingCategoryId: string;
    let project1Id: string;
    let project2Id: string;
    let hp1Id: string;
    let hp2Id: string;

    beforeAll(async () => {
        const proj1 = await prisma.project.create({
            data: {
                title: 'Author Project',
                description: 'Test project for author',
                userId: AUTHOR.id,
            },
        });
        project1Id = proj1.id;

        const proj2 = await prisma.project.create({
            data: {
                title: 'Participant Project',
                description: 'Test project for participant',
                userId: PARTICIPANT.id,
            },
        });
        project2Id = proj2.id;
    });

    describe('Phase 1: Creation and Setup', () => {
        it('should fail to create a hackathon without authentication', async () => {
            const res = await request(app).post('/api/hackathon').send({});
            expect(res.statusCode).toBe(403);
        });

        it('should successfully create a new hackathon (as Author)', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

            const newHackathonDto = {
                title: 'My E2E Test Hackathon',
                description: 'A test hackathon',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                allowParticipantRating: true,
                allowPublicRating: false,
                judgeIds: [JUDGE.id],
                newRatingCategories: [{ name: 'Innovation', order: 1 }],
            };

            const res = await request(app)
                .post('/api/hackathon')
                .set('Authorization', `Bearer ${AUTHOR.token}`)
                .send(newHackathonDto);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('My E2E Test Hackathon');
            expect(res.body.data.authorId).toBe(AUTHOR.id);

            hackathonId = res.body.data.id;
        });

        it('should get hackathon details and verify settings', async () => {
            const res = await request(app).get(`/api/hackathon/${hackathonId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.judges).toEqual(
                expect.arrayContaining([expect.objectContaining({ id: JUDGE.id })])
            );
            expect(res.body.data.allowParticipantRating).toBe(true);
            expect(res.body.data.allowPublicRating).toBe(false);
            expect(res.body.data.ratingCategories).toEqual(
                expect.arrayContaining([expect.objectContaining({ name: 'Innovation' })])
            );

            ratingCategoryId = res.body.data.ratingCategories[0].id;
        });
    });

    describe('Phase 2: Participation and Submissions', () => {
        it('should allow Participant to join the hackathon', async () => {
            const res = await request(app)
                .post(`/api/hackathon/${hackathonId}/join`)
                .set('Authorization', `Bearer ${PARTICIPANT.token}`);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.userId).toBe(PARTICIPANT.id);
        });

        it('should allow Author to join the hackathon', async () => {
            const res = await request(app)
                .post(`/api/hackathon/${hackathonId}/join`)
                .set('Authorization', `Bearer ${AUTHOR.token}`);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.userId).toBe(AUTHOR.id);
        });

        it('should allow Author to submit their own project', async () => {
            const res = await request(app)
                .post(`/api/hackathon/${hackathonId}/submit`)
                .set('Authorization', `Bearer ${AUTHOR.token}`)
                .send({ projectId: project1Id });

            expect(res.statusCode).toBe(201);
            expect(res.body.data.projectId).toBe(project1Id);
            hp1Id = res.body.data.id;
        });

        it('should allow Participant to submit their own project', async () => {
            const res = await request(app)
                .post(`/api/hackathon/${hackathonId}/submit`)
                .set('Authorization', `Bearer ${PARTICIPANT.token}`)
                .send({ projectId: project2Id });

            expect(res.statusCode).toBe(201);
            expect(res.body.data.projectId).toBe(project2Id);
            hp2Id = res.body.data.id;
        });

        it('should fail if Participant tries to submit Author project', async () => {
            const res = await request(app)
                .post(`/api/hackathon/${hackathonId}/submit`)
                .set('Authorization', `Bearer ${PARTICIPANT.token}`)
                .send({ projectId: project1Id });

            expect(res.statusCode).toBe(403);
        });
    });

    describe('Phase 3: Rating', () => {
        it('should fail if Participant tries to rate their own project', async () => {
            const ratingDto = { categoryId: ratingCategoryId, rating: 8 };

            const res = await request(app)
                .post(`/api/hackathon/project/${hp2Id}/rate`)
                .set('Authorization', `Bearer ${PARTICIPANT.token}`)
                .send(ratingDto);

            expect(res.statusCode).toBe(403);
            expect(res.body.error.message).toContain('Participants cannot rate their own projects');
        });

        it('should allow Participant to rate Author project', async () => {
            const ratingDto = { categoryId: ratingCategoryId, rating: 7 };

            const res = await request(app)
                .post(`/api/hackathon/project/${hp1Id}/rate`)
                .set('Authorization', `Bearer ${PARTICIPANT.token}`)
                .send(ratingDto);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.raterType).toBe('PARTICIPANT');
            expect(res.body.data.rating).toBe(7);
        });

        it('should allow Judge to rate Author project', async () => {
            const ratingDto = { categoryId: ratingCategoryId, rating: 10 };

            const res = await request(app)
                .post(`/api/hackathon/project/${hp1Id}/rate`)
                .set('Authorization', `Bearer ${JUDGE.token}`)
                .send(ratingDto);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.raterType).toBe('JUDGE');
            expect(res.body.data.rating).toBe(10);
        });

        it('should allow Judge to rate Participant project', async () => {
            const ratingDto = { categoryId: ratingCategoryId, rating: 9 };

            const res = await request(app)
                .post(`/api/hackathon/project/${hp2Id}/rate`)
                .set('Authorization', `Bearer ${JUDGE.token}`)
                .send(ratingDto);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.raterType).toBe('JUDGE');
            expect(res.body.data.rating).toBe(9);
        });
    });

    describe('Phase 4: Leaderboard and Teardown', () => {
        it('should get the combined leaderboard (SUM)', async () => {
            const res = await request(app).get(`/api/hackathon/${hackathonId}/leaderboard`);

            expect(res.statusCode).toBe(200);
            const leaderboard = res.body.data;


            expect(leaderboard[0].projectId).toBe(hp1Id);
            expect(leaderboard[0].totalScore).toBe(17);

            expect(leaderboard[1].projectId).toBe(hp2Id);
            expect(leaderboard[1].totalScore).toBe(9);
        });

        it('should get the JUDGE-only leaderboard', async () => {
            const res = await request(app).get(`/api/hackathon/${hackathonId}/leaderboard?type=JUDGE`);

            expect(res.statusCode).toBe(200);
            const leaderboard = res.body.data;

            expect(leaderboard[0].projectId).toBe(hp1Id);
            expect(leaderboard[0].totalScore).toBe(10);

            expect(leaderboard[1].projectId).toBe(hp2Id);
            expect(leaderboard[1].totalScore).toBe(9);
        });

        it('should get the PARTICIPANT-only leaderboard', async () => {
            const res = await request(app).get(`/api/hackathon/${hackathonId}/leaderboard?type=PARTICIPANT`);

            expect(res.statusCode).toBe(200);
            const leaderboard = res.body.data;

            expect(leaderboard[0].projectId).toBe(hp1Id);
            expect(leaderboard[0].totalScore).toBe(7);
            expect(leaderboard.length).toBe(1);
        });

        it('should fail to delete the hackathon (as Participant)', async () => {
            const res = await request(app)
                .delete(`/api/hackathon/${hackathonId}`)
                .set('Authorization', `Bearer ${PARTICIPANT.token}`);

            expect(res.statusCode).toBe(403);
        });

        it('should successfully delete the hackathon (as Author)', async () => {
            const res = await request(app)
                .delete(`/api/hackathon/${hackathonId}`)
                .set('Authorization', `Bearer ${AUTHOR.token}`);

            expect(res.statusCode).toBe(200);
        });

        it('should return 404 for the deleted hackathon', async () => {
            const res = await request(app).get(`/api/hackathon/${hackathonId}`);
            expect(res.statusCode).toBe(404);
        });
    });
});