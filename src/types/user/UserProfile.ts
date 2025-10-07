export interface UpdateUserData {
    githubId?: string;
    avatarUrl?: string;
    isVerified?: boolean;
    password?: string;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
    emailVerificationToken?: string | null;
    emailVerificationExpires?: Date | null;
}