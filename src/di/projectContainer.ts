import { container } from 'tsyringe';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectMetricsRepository } from '../repositories/project.metrics.repository';
import { ProjectService } from '../services/project.service';
import { ProjectServiceLike } from '../services/project.service.like';
import { ProjectServiceView } from '../services/project.service.view';
import {ProjectMediaRepository} from "../repositories/project.media.repository";
import {ProjectServiceMedia} from "../services/project.service.media";
import {AzureBlobService} from "../services/azure.blob.service";

container.register('IProjectRepository', { useClass: ProjectRepository });
container.register('IProjectMetricsRepository', {
    useClass: ProjectMetricsRepository,
});
container.register('IProjectMediaRepository', { useClass: ProjectMediaRepository });
container.register('IProjectServiceMedia', { useClass: ProjectServiceMedia });
container.register('IProjectService', { useClass: ProjectService });
container.register('IProjectServiceLike', { useClass: ProjectServiceLike });
container.register('IProjectServiceView', { useClass: ProjectServiceView });
container.register('IAzureBlobService', { useClass: AzureBlobService });

