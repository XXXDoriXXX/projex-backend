export interface OAuthProfile {
    email: string;
    name: string;
    avatar?: string;
    provider: 'google' | 'github';
    providerId: string;
}

export interface OAuthProvider {
    verify(input: any): Promise<OAuthProfile>;
}