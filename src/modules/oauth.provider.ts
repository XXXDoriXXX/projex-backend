
import { injectable } from "tsyringe";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

export interface IGoogleOAuthProvider {
    verifyIdToken(idToken: string): Promise<{ email: string; sub: string }>;
}

export interface IGithubOAuthProvider {
    exchangeCode(code: string): Promise<{ accessToken: string }>;
    getUser(accessToken: string): Promise<{ id: string; login: string; avatar_url?: string; email?: string }>;
}

@injectable()
export class GoogleOAuthProvider implements IGoogleOAuthProvider {
    private client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    async verifyIdToken(idToken: string) {
        const ticket = await this.client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload?.sub) throw new Error("Invalid Google token");
        return { email: payload.email, sub: payload.sub };
    }
}

@injectable()
export class GithubOAuthProvider implements IGithubOAuthProvider {
    private clientId = process.env.GITHUB_CLIENT_ID!;
    private clientSecret = process.env.GITHUB_CLIENT_SECRET!;

    async exchangeCode(code: string) {
        const resp = await axios.post(
            "https://github.com/login/oauth/access_token",
            { client_id: this.clientId, client_secret: this.clientSecret, code },
            { headers: { Accept: "application/json" } }
        );
        if (!resp.data.access_token) throw new Error("GitHub auth failed");
        return { accessToken: resp.data.access_token as string };
    }

    async getUser(accessToken: string) {
        const me = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return {
            id: String(me.data.id),
            login: me.data.login as string,
            avatar_url: me.data.avatar_url as string | undefined,
            email: me.data.email as string | undefined,
        };
    }
}
