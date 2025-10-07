import bcrypt from "bcryptjs";
import {inject, injectable} from "tsyringe";
import {type IAuthRepository} from "../repositories/auth.repository";
import {type IEmailProvider} from "../modules/email.provider";
import {type ITokenProvider} from "../modules/token.provider";
import {User} from "@prisma/client";
import {ForbiddenError} from "routing-controllers";
import {generateToken} from "../utils/generateToken";


const MINUTES = (m: number) => m * 60 * 1000;
export interface IAuthService {
  getUserById(id: string): Promise<User>;
}
@injectable()
export class AuthService  implements IAuthService {
    constructor(
        @inject("IAuthRepository") private readonly authRepo: IAuthRepository,
        @inject("IEmailProvider") private readonly email: IEmailProvider,
        @inject("ITokenProvider") private readonly tokens: ITokenProvider
    ) {
    }

    private generate6Code() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async getUserById(id: string): Promise<User> {
        const user = await this.authRepo.getUserById(id);
        if (!user) throw new Error("User not found");
        return user;
    }
    async login(email: string, password: string) {
        const user = await this.authRepo.getUserByEmail(email);
        if (!user) throw new ForbiddenError('User not found');
        if(!user.isActive) throw new ForbiddenError('User is deactivated');
        if(!user.password) throw new ForbiddenError('Passwords do not match');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new ForbiddenError("Invalid email or password");

        const token = generateToken(user.id,  user.username  );

        return { token, user: { id: user.id, username: user.username, email: user.email } };
    }
}