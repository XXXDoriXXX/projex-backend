import {DatabaseError, NotFoundError, ValidationError} from "../errors/CustomErrors";
import {hashIp} from "../utils/hashIp";
import {ProjectRepository} from "../repositories/project.repository";
import {ProjectMetricsRepository} from "../repositories/project.metrics.repository";
import {Service} from "typedi";

@Service()
export class ProjectServiceView{
    constructor(
        public repoProject: ProjectRepository,
        public repoView: ProjectMetricsRepository) {}
    async recordProjectView(
        projectId: string,
        opts?: { userId?: string; ip?: string; ipHash?: string },
    ) {
        console.log(opts)
        const userId = opts?.userId ?? null;

        if (!projectId) {
            throw new ValidationError("Project ID is required", "projectId");
        }

        const project = await this.repoProject.findById(projectId);
        if (!project) {
            throw new NotFoundError("Project", projectId);
        }

        try {
            if (userId) {
                return await this.repoView.upsertView(projectId,userId);
            }
            console.log(opts?.ip);
            const salt = process.env.IP_HASH_SALT;
            if (!opts?.ip && !opts?.ipHash) {
                throw new ValidationError("IP is required for anonymous view", "ip");
            }
            if (!salt && !opts?.ipHash) {
                throw new ValidationError("IP_HASH_SALT is not set", "IP_HASH_SALT");
            }

            const finalIpHash =
                opts?.ipHash ?? hashIp(opts!.ip as string, salt as string);

            return await this.repoView.upsertAnonymousView(projectId, finalIpHash);
        } catch (err: any) {
            throw new DatabaseError("Failed to record project view", {
                projectId,
                reason: err?.message,
            });
        }
    };

}
