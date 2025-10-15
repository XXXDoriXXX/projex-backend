import { GithubOAuthProvider, GoogleOAuthProvider, type IGithubOAuthProvider, type IGoogleOAuthProvider } from '../modules/oauth.provider';
import { inject, injectable } from 'tsyringe';
import { ValidationError } from '../errors/CustomErrors';
import { OAuthProfile, OAuthProvider } from '../types/auth/OAuth';

export interface IOAuthService {
    verify(provider: string, data: any): Promise<OAuthProfile>;
}
@injectable()
export class OAuthService implements IOAuthService {
    private providers: Record<string, OAuthProvider>;
    constructor(
        @inject('IGoogleOAuthProvider') private readonly google: IGoogleOAuthProvider,
        @inject('IGithubOAuthProvider') private readonly github: IGithubOAuthProvider,
    ) {
        this.providers = {
            google: this.google,
            github: this.github,
        };
    }
    async verify(provider: string, data: any): Promise<OAuthProfile> {
        const impl = this.providers[provider];
        if (!impl) throw new ValidationError('Unsupported OAuth provider');
        return await impl.verify(data);
    }
}
