// src/dto/project/project.response.ts
import { z } from "zod";
import { VisibilitySchema } from "./project.dto";

export const ProjectMediaResp = z.object({
    id: z.string(),
    url: z.string().url(),
    type: z.string().optional(),
    caption: z.string().optional(),
});

export const TechnologyResp = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
});

export const ProjectResp = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string(),
    previewUrl: z.string().url().nullable(),
    githubUrl: z.string().url().nullable().optional(),
    demoUrl: z.string().url().nullable().optional(),
    visibility: VisibilitySchema.optional(), // якщо є термін «visible», узгодь з моделлю
    privateLinkToken: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    media: z.array(ProjectMediaResp),
    technologies: z.array(TechnologyResp),
    stats: z
        .object({
            likes: z.number().int().nonnegative().optional(),
            views: z.number().int().nonnegative().optional(),
        })
        .optional(),
});
export type ProjectResponseDto = z.infer<typeof ProjectResp>;
