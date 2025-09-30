type ProjectDto = {
    id: string;
    title: string;
    description: string;
    previewUrl: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    media: { id: string; type: 'image' | 'video'; url: string }[];
    technologies: { id: string; name: string }[];
    metrics: {
        likes: number;
        views: {
            rows: number;
            total: number;
        };
    };
};
