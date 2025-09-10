export type CreateProjectData = {
	userId: string;
	title: string;
	description: string;
	githubUrl?: string;
	demoUrl?: string;
	media?: { type: "image" | "video"; url: string }[];
	technologies?: string[];
};
