import 'reflect-metadata';
import { container } from 'tsyringe';
import { IUserRepository, UserRepository } from '../repositories/user.repository';
import { IUserService, UserService } from '../services/user.service';

container.register<IUserRepository>('IUserRepository', {
    useClass: UserRepository,
});

container.register<IUserService>('IUserService', {
    useClass: UserService,
});