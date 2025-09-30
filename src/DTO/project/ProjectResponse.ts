
import { ProjectMedia, Technology, User } from '@prisma/client';

export interface ProjectResponseDto {
    id: string;
    userId: string;
    title: string;
    description: string;
    githubUrl: string | null;
    demoUrl: string | null;
    previewUrl: string | null;
    privateLinkToken: string | null;
    createdAt: Date;
    updatedAt: Date;

    user?: User;
    media: ProjectMedia[];
    technologies: Technology[];

    likesCount: number;
    viewsCount: number;
}
