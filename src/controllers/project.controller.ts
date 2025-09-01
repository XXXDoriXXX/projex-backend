import { Request, Response } from 'express';
import * as authService from '../services/project.service';
import {AuthenticatedRequest} from "../middleware/auth";
import {CreateProjectData} from "../types/Project";
export const uploadMedia = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.body.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    //s3 logic upload
    return res.status(501).json({ message: 'Not implemented' });
}
export const createProject = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const {
        title,
        description,
        githubUrl,
        demoUrl,
        media,
        technologies}= req.body;
    const projectData: CreateProjectData = {
        userId,
        title,
        description,
        githubUrl,
        demoUrl,
        media,
        technologies } as CreateProjectData;
    try {
        const project = await authService.createProject(projectData );
        return res.status(201).json(project);
    } catch (err: any) {
        console.error('Error creating project:', err);

        return res.status(400).json({ message: err.message });
    }

}
export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
   const userId = req.user?.userId;
    const projectId = req.params.id;

    try {
        const project = await authService.deleteProject(projectId, userId!);
        return res.status(200).json(project);
    }
    catch (err: any) {
        console.error('Error deleting project:', err);
        if (err.message === 'Project not found') {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (err.message === 'Unauthorized') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        return res.status(500).json({ message:err.message });
    }
}