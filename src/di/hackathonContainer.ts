import { container } from 'tsyringe';
import { HackathonRepository } from '../repositories/hackathon.repository';
import { HackathonService } from '../services/hackathon.service';

container.register('IHackathonRepository', {
    useClass: HackathonRepository,
});
container.register('IHackathonService', {
    useClass: HackathonService,
});