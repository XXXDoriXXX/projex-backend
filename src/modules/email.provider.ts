import { injectable } from "tsyringe";
import { Resend } from "resend";
export interface IEmailProvider {
    sendVerification(email: string, code: string, username?: string): Promise<void>;
    sendPasswordReset(email: string, code: string, username?: string): Promise<void>;
}

@injectable()
export class ResendEmailProvider implements IEmailProvider {
    private resend = new Resend(process.env.RESEND_API_KEY || "");

    async sendVerification(email: string, code: string, username?: string) {
        await this.resend.emails.send({
            from: "no-reply@projex.foo",
            to: email,
            subject: "Confirm your email for Projex",
            html: `
        Thanks for signing up for <b>Projex</b>!<br/>
        Your 6-digit verification code: <b>${code}</b><br/>
        Expires in 10 minutes.
        ${username ? `<br/>Hi <b>${username}</b>!` : ""}
      `,
        });
    }

    async sendPasswordReset(email: string, code: string, username?: string) {
        await this.resend.emails.send({
            from: "no-reply@projex.foo",
            to: email,
            subject: "Reset your Projex password",
            html: `
        We received a password reset request.<br/>
        Your code: <b>${code}</b><br/>
        Expires in 10 minutes.
        ${username ? `<br/>Hi <b>${username}</b>!` : ""}
      `,
        });
    }
}