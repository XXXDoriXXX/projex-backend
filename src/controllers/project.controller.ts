import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import {AuthenticatedRequest} from "../middleware/auth";
import {CreateProjectData} from "../types/Project";
import {ProjectVisible} from "../types/ProjectVisible";
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
        const project = await projectService.createProject(projectData );
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
        const project = await projectService.deleteProject(projectId, userId!);
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
export const updateProject = async (req:AuthenticatedRequest, res:Response) =>{
    const userId = req.user?.userId;
    const projectId = req.params.id;
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
        const updatedProject = await projectService.updateProject(projectId,projectData);
        return res.status(200).json(updatedProject);
    }
    catch (err: any) {
        console.error('Error updating project:', err);
        return res.status(400).json({ message: err.message });
    }
}
export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
    const projectId = req.params.id;
    const userId = req.user?.userId;
    const token = req.params.token;
    try {
        const project = await projectService.getProjectById(projectId, token, userId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        return res.status(200).json(project);
    } catch (err:any) {
        console.error('Error fetching project:', err);
        return res.status(500).json({ message: err.message});
    }
}
export const getUserProjects = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
        const projects = await projectService.getUserProjects(userId);
        return res.status(200).json(projects);
    } catch (err:any) {
        console.error("Error fetching user's projects:", err);
        return res.status(500).json({ message: err.message });
    }
}
export const changeProjectVisibility = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    const projectId = req.params.id;
    const projectVisible:ProjectVisible =  req.body.visible;
    try {
        const updatedProject = await projectService.changeProjectVisibility(projectId, userId!, projectVisible);
        return res.status(200).json(updatedProject);
    } catch (err: any) {
        console.error('Error changing project visibility:', err);
        if (err.message === 'Project not found') {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (err.message === 'Unauthorized') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        return res.status(500).json({ message: err.message });
    }
}