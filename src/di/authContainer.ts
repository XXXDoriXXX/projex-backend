import "reflect-metadata";
import { container } from "tsyringe";
import {AuthRepository, IAuthRepository} from "../repositories/auth.repository";
import {IEmailProvider, ResendEmailProvider} from "../modules/email.provider";
import {ITokenProvider, JwtTokenProvider} from "../modules/token.provider";
import {AuthService, IAuthService} from "../services/auth.service";

container.register<IAuthRepository>("IAuthRepository", { useClass: AuthRepository });
container.register<IEmailProvider>("IEmailProvider", { useClass: ResendEmailProvider });
container.register<ITokenProvider>("ITokenProvider", { useClass: JwtTokenProvider });
container.register<IAuthService>("IAuthService", { useClass: AuthService });
container.register<IAuthRepository>("IAuthRepository", { useClass: AuthRepository });