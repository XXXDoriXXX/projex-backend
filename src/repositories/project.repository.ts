import { PrismaClient } from "@prisma/client";
import prisma from "../prisma";
import {NotFoundError} from "../errors/CustomErrors";
import {ensureAccess} from "../utils/encruceAcces";


export class ProjectRepository{
    constructor(private prisma: PrismaClient) {}

    async findById(id: string) {
        return prisma.project.findUnique({
            where: { id },
                include: {
                    media: true,
                    technologies: true,
                    _count: { select: { likes: true, views: true } },
                },
        });
    }
    async getViewsCount(projectId: string) {
        return this.prisma.view.aggregate({
            where: { projectId: projectId },
            _sum: { count: true },
        });
    }
}