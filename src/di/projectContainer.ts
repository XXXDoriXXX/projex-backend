import {container} from "tsyringe";
import {ProjectRepository} from "../repositories/project.repository";
import {ProjectMetricsRepository} from "../repositories/project.metrics.repository";
import {ProjectService} from "../services/project.service";
import {ProjectServiceLike} from "../services/project.service.like";
import {ProjectServiceView} from "../services/project.service.view";

container.register("IProjectRepository", {useClass: ProjectRepository});
container.register("IProjectMetricsRepository", {useClass: ProjectMetricsRepository});
container.register("IProjectService", {useClass: ProjectService});
container.register("IProjectServiceLike", {useClass: ProjectServiceLike});
container.register("IProjectServiceView", {useClass: ProjectServiceView});