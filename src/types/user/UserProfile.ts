export interface UserProfile {
    id?: string;
    username?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
    isVerified?: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    isActive?: boolean;
    passwordHash?: string;
}
