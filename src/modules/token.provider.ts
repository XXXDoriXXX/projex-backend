
import { injectable } from "tsyringe";
import jwt from "jsonwebtoken";

export interface TokenPayload {
    sub: string;
    email: string;
    username: string;
}

export interface ITokenProvider {
  
}

@injectable()
export class JwtTokenProvider implements ITokenProvider {
    private secret = process.env.JWT_SECRET || "MewMewMew";


}
