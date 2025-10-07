
export interface RegisterDto { username: string; email: string; password: string; }
export interface LoginDto { email: string; password: string; }
export interface VerifyEmailDto { token: string; }
export interface SendEmailDto { email: string; }
export interface ResetPasswordInitDto { email: string; }
export interface ResetPasswordConfirmDto { email: string; code: string; newPassword: string; }
