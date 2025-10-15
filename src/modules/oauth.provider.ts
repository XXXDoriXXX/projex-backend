import { injectable } from 'tsyringe';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { ValidationError } from '../errors/CustomErrors';
import { OAuthProfile, OAuthProvider } from '../types/auth/OAuth';

export interface IGoogleOAuthProvider {
    verify(code: string): Promise<OAuthProfile>;
}

export interface IGithubOAuthProvider {
    verify(code: string): Promise<OAuthProfile>;
}

@injectable()
export class GoogleOAuthProvider implements OAuthProvider {
    private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    async verify(idToken: string): Promise<OAuthProfile> {
        const ticket = await this.client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload?.sub) throw new ValidationError('Invalid Google token');
        return {
            email: payload.email,
            name: payload.name ?? payload.email.split('@')[0],
            avatar: payload.picture,
            provider: 'google',
            providerId: payload.sub,
        };
    }
}
@injectable()
export class GithubOAuthProvider implements OAuthProvider {
    private clientId = process.env.GITHUB_CLIENT_ID!;
    private clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    async verify(code: string): Promise<OAuthProfile> {
        const tokenResp = await axios.post(
            'https://github.com/login/oauth/access_token',
            { client_id: this.clientId, client_secret: this.clientSecret, code },
            { headers: { Accept: 'application/json' } },
        );
        const token = tokenResp.data.access_token;
        if (!token) throw new ValidationError('Invalid GitHub code');
        const [userRes, emailRes] = await Promise.all([
            axios.get('https://api.github.com/user', {
                headers: { Authorization: `token ${token}` },
            }),
            axios.get('https://api.github.com/user/emails', {
                headers: { Authorization: `token ${token}` },
            }),
        ]);
        const email = emailRes.data.find((e: any) => e.primary && e.verified)?.email;
        if (!email) throw new ValidationError('No verified email found in GitHub account');
        const u = userRes.data;
        return {
            email,
            name: u.name ?? u.login,
            avatar: u.avatar_url,
            provider: 'github',
            providerId: u.id.toString(),
        };
    }
}
