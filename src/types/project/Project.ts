export type CreateProjectData = {
    userId: string;
    title: string;
    description: string;
    githubUrl?: string;
    demoUrl?: string;
    mediaIds?: string[];
    technologies?: string[];
    visible?: string;
    subauthorIds?: string[];
    previewId?: string;
};
