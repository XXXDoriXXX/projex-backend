import { Project, ProjectMedia, Technology, User } from '@prisma/client';
import {UserInfo} from "../../services/auth.service";

export type ProjectWithDetails = Project & {
    user: UserInfo;
    media: ProjectMedia[];
    technologies: Technology[];
    _count: { likes: number; views: number };
    subauthors: UserInfo[];
};

export type ProjectExists = Project | null;
export type ViewsAggregation = { _sum: { count: number | null } };
