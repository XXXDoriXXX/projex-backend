import { z } from 'zod';

export const VisibilitySchema = z.enum(['public', 'link', 'private']);
export type ProjectVisible = z.infer<typeof VisibilitySchema>;

const nonEmpty = z.string().trim().min(1);
const urlOptional = z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined));

export const MediaItemDto = z.object({
    url: z.string().trim().url(),
    type: z.enum(['image', 'video', 'file']).optional(),
    caption: z.string().trim().max(300).optional(),
});
export type MediaItemDto = z.infer<typeof MediaItemDto>;

export const CreateProjectDto = z.object({
    title: nonEmpty.max(200),
    description: nonEmpty.max(10_000),
    githubUrl: urlOptional,
    demoUrl: urlOptional,
    media: z.array(MediaItemDto).default([]),
    technologies: z.array(z.string().trim().min(1).max(50)).default([]),
});
export type CreateProjectDto = z.infer<typeof CreateProjectDto>;

export const UpdateProjectDto = CreateProjectDto.partial();
export type UpdateProjectDto = z.infer<typeof UpdateProjectDto>;

export const ChangeVisibilityDto = z.object({
    visible: VisibilitySchema,
});
export type ChangeVisibilityDto = z.infer<typeof ChangeVisibilityDto>;

export const ProjectIdParamDto = z.object({
    id: z
        .string()
        .uuid()
        .or(z.string().regex(/^[A-Za-z0-9_-]{10,}$/)),
});
export type ProjectIdParamDto = z.infer<typeof ProjectIdParamDto>;

export const UserIdParamDto = z.object({
    id: z.string().uuid().or(z.string().min(1)),
});
export type UserIdParamDto = z.infer<typeof UserIdParamDto>;

export const GetProjectByIdQueryDto = z.object({
    token: z.string().trim().min(1).optional(),
});
export type GetProjectByIdQueryDto = z.infer<typeof GetProjectByIdQueryDto>;

export const PaginationQueryDto = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQueryDto = z.infer<typeof PaginationQueryDto>;
