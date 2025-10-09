import { injectable } from "tsyringe";
import { Resend } from "resend";
export interface IEmailProvider {
    sendVerification(email: string, code: string, username?: string): Promise<void>;
    sendPasswordReset(email: string, code: string, username?: string): Promise<void>;
    sendVerificationConfirmation(email: string, username?: string): Promise<void>;
    sendPasswordChangeConfirmation(email: string, username?: string): Promise<void>;
}

@injectable()
export class ResendEmailProvider implements IEmailProvider {
    private resend = new Resend(process.env.RESEND_API_KEY || "");

    async sendVerification(email: string, code: string, username?: string) {
        await this.resend.emails.send({
            from: "no-reply@projex.foo",
            to: email,
            subject: "Verify your email for Projex",
            html: `
      <div style="font-family: Inter, Roboto, sans-serif; color:#111; line-height:1.6; padding:24px;">
        <h2 style="margin-bottom:12px;">Welcome to <span style="color:#3b82f6;">Projex</span>${username ? `, ${username}` : ""} 👋</h2>
        <p>Thanks for joining our platform! Please use the code below to verify your email address.</p>

        <div style="margin:24px 0; text-align:center;">
          <div style="display:inline-block; font-size:28px; font-weight:600; letter-spacing:4px; background:#f3f4f6; padding:12px 20px; border-radius:8px; border:1px solid #e5e7eb;">
            ${code}
          </div>
          <p style="margin-top:8px; color:#6b7280;">This code will expire in <b>10 minutes</b>.</p>
        </div>

        <p>If you didn’t request this, just ignore this email — your account is safe.</p>
        <hr style="margin:32px 0; border:none; border-top:1px solid #e5e7eb;"/>
        <p style="font-size:13px; color:#9ca3af;">Sent automatically by Projex<br/>Please do not reply to this email.</p>
      </div>
    `,
        });
    }
    async sendVerificationConfirmation(email: string, username?: string) {
        await this.resend.emails.send({
            from: "no-reply@projex.foo",
            to: email,
            subject: "Your email has been verified ✅",
            html: `
      <div style="font-family: Inter, Roboto, sans-serif; color:#111; line-height:1.6; padding:24px;">
        <h2 style="margin-bottom:12px;">Email verified successfully${username ? `, ${username}` : ""} 🎉</h2>
        <p>Your email address has been confirmed and your <b>Projex</b> account is now fully activated.</p>
        
        <div style="margin:24px 0; text-align:center;">
          <a href="https://projex.foo/dashboard"
             style="background-color:#3b82f6; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:500; display:inline-block;">
            Go to Dashboard
          </a>
        </div>

        <p>Welcome aboard — start managing your projects smarter 🚀</p>

        <hr style="margin:32px 0; border:none; border-top:1px solid #e5e7eb;"/>
        <p style="font-size:13px; color:#9ca3af;">Sent automatically by Projex<br/>Please do not reply to this email.</p>
      </div>
    `,
        });
    }

    async sendPasswordReset(email: string, code: string, username?: string): Promise<void> {
        const safeUsername = username ? username.replace(/[<>]/g, '') : '';

        await this.resend.emails.send({
            from: 'no-reply@projex.foo',
            to: email,
            subject: 'Reset your password for Projex',
            html: `
      <div style="font-family: Inter, Roboto, sans-serif; color:#111; line-height:1.6; padding:24px;">
        <h2 style="margin-bottom:12px;">Password Reset Request${safeUsername ? `, ${safeUsername}` : ''}</h2>
        <p>We received a request to reset your Projex account password.</p>

        <div style="margin:24px 0; text-align:center;">
          <div style="display:inline-block; font-size:28px; font-weight:600; letter-spacing:4px; background:#f3f4f6; padding:12px 20px; border-radius:8px; border:1px solid #e5e7eb;">
            ${code}
          </div>
          <p style="margin-top:8px; color:#6b7280;">This code will expire in <b>10 minutes</b>.</p>
        </div>

        <p>If you didn’t request this, you can safely ignore this message — your account remains secure.</p>

        <hr style="margin:32px 0; border:none; border-top:1px solid #e5e7eb;"/>
        <p style="font-size:13px; color:#9ca3af;">
          Sent automatically by <span style="color:#3b82f6;">Projex</span><br/>
          Please do not reply to this email.
        </p>
      </div>
    `,
        });
    }
    async sendPasswordChangeConfirmation(email: string, username?: string): Promise<void> {
        const safeUsername = username ? username.replace(/[<>]/g, '') : '';

        await this.resend.emails.send({
            from: 'no-reply@projex.foo',
            to: email,
            subject: 'Your Projex password was changed',
            html: `
      <div style="font-family: Inter, Roboto, sans-serif; color:#111; line-height:1.6; padding:24px;">
        <h2 style="margin-bottom:12px;">Password Changed${safeUsername ? `, ${safeUsername}` : ''}</h2>
        <p>Your Projex account password was successfully changed.</p>

        <div style="margin:24px 0; text-align:center;">
          <div style="display:inline-block; font-size:16px; font-weight:500; background:#f3f4f6; padding:10px 18px; border-radius:8px; border:1px solid #e5e7eb;">
            If this wasn’t you, please reset your password immediately.
          </div>
        </div>

        <p style="color:#6b7280;">If you didn’t perform this action, we recommend changing your password again and reviewing your account activity.</p>

        <hr style="margin:32px 0; border:none; border-top:1px solid #e5e7eb;"/>
        <p style="font-size:13px; color:#9ca3af;">
          Sent automatically by <span style="color:#3b82f6;">Projex</span><br/>
          Please do not reply to this email.
        </p>
      </div>
    `,
        });
    }


}