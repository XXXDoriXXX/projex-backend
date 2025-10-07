import {container, inject, injectable} from "tsyringe";
import {AuthService} from "../services/auth.service";
import {asyncHandler} from "../utils/asyncHandler";
import {Request, Response} from "express";
import {AuthenticatedRequest} from "../middleware/auth";
import {ValidationError} from "../errors/CustomErrors";
import {ForbiddenError} from "routing-controllers";

@injectable()
export class authController {
    constructor(@inject("IAuthService") private readonly authService: AuthService) {}
    public getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (typeof userId === "string") {
            const user = await this.authService.getUserById(userId);
            res.status(200).json({ success: true, data: user, message: 'User fetched' });
        }
    });
    public login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
          throw new ValidationError("Email and password are required", "email/password");
        }
        try {
            const result = await this.authService.login(email, password);
            res.status(200).json({ success: true, ...result, message: 'Login successful' });
        } catch (error: any) {
            throw new ForbiddenError(error);
        }
    })
}


