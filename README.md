# ProjeX Backend

REST API for ProjeX, a platform where developers publish their projects, follow each other and take part in hackathons.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Azure](https://img.shields.io/badge/Azure_Blob_Storage-0078D4?logo=microsoftazure&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)

**Live demo:** [projex-frontend-hazel.vercel.app](https://projex-frontend-hazel.vercel.app)

## Related repositories

| Repository | Role |
| --- | --- |
| [projex-backend](https://github.com/XXXDoriXXX/projex-backend) | This repo. REST API, database and file storage. |
| [projex-frontend](https://github.com/XXXDoriXXX/projex-frontend) | React web client. Its origin is already allowed by this API's CORS settings. |

## Features

- **Auth:** email and password registration and login, Google sign-in, GitHub sign-in, email verification and password reset codes (sent with Resend), JWT tokens valid for 24 hours.
- **Projects:** create, edit, delete, change status and visibility, list all projects or a user's projects, share private projects with a token link, technology tags.
- **Engagement:** likes, and view counting with hashed IPs for guests.
- **Media:** image and video upload to Azure Blob Storage, with processing by sharp and ffmpeg.
- **Users:** profiles, avatars, social links, follow and unfollow, followers and following lists.
- **Hackathons:** create and manage hackathons, join and leave, submit projects, rate projects by category, leaderboard, theme and rating categories.
- **Operations:** server status endpoint, request IDs, structured logging (winston), Helmet, CORS allow-list, request validation.

## Tech stack

Node.js, TypeScript, Express 5, Prisma 6 with PostgreSQL, tsyringe (dependency injection), zod and express-validator, JSON Web Tokens, bcryptjs, multer, sharp, fluent-ffmpeg, Azure Blob Storage, Resend, winston, Jest with supertest.

## API overview

Base routes are mounted in `src/app.ts`:

| Prefix | Purpose |
| --- | --- |
| `/api/status` | Server status |
| `/api/auth` | Login, register, OAuth, email verification, password reset |
| `/api/project` | Projects, likes, views, technologies, media upload |
| `/api/user` | Profiles, social links, avatar, follows |
| `/api/hackathon` | Hackathons, participation, submissions, ratings, leaderboard |

## Getting started

Requirements: Node.js and a PostgreSQL database.

```bash
git clone https://github.com/XXXDoriXXX/projex-backend.git
cd projex-backend
npm install
```

Create a `.env` file in the project root (see the table below), then:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The API starts on `http://localhost:3000` (or the `PORT` you set). Optionally fill the technologies table with `npx tsx prisma/seed/tech.seed.ts`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with auto-reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server from `dist/index.js` |
| `npm test` | Run Jest tests |
| `npm run prisma -- <args>` | Run the Prisma CLI |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `PORT` | No | Server port, defaults to `3000` |
| `NODE_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | Log level, defaults to `debug` (development) or `info` (production) |
| `ALLOWED_ORIGINS` | No | Extra CORS origins, comma separated |
| `GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth client ID |
| `GITHUB_CLIENT_ID` | For GitHub sign-in | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | For GitHub sign-in | GitHub OAuth app client secret |
| `RESEND_API_KEY` | For emails | Resend API key |
| `AZURE_STORAGE_CONNECTION_STRING` | For media upload | Azure Storage connection string |
| `AZURE_STORAGE_CONTAINER_NAME` | For media upload | Blob container name |
| `IP_HASH_SALT` | Recommended | Salt used to hash guest IPs for view counting |

Example `.env` (placeholders only):

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/projex
JWT_SECRET=change-me
```

## Project structure

```
src/
  routes/        HTTP routes
  controllers/   Request handlers
  services/      Business logic
  repositories/  Database access (Prisma)
  middleware/    Auth, validation, logging, errors
  di/            Dependency injection containers
prisma/          Schema, migrations, seed
```
