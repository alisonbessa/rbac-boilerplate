import { loadServerEnv } from '@rbac-boilerplate/config';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export type EmailPayload = {
  to: string;
  template: 'reset-password' | 'new-device-login';
  variables: Record<string, string>;
};

export interface EmailProvider {
  sendEmail(payload: EmailPayload): Promise<void>;
}

export class DevMailpitProvider implements EmailProvider {
  // Placeholder - integrate SMTP or Mailpit REST when needed
  async sendEmail(payload: EmailPayload): Promise<void> {
    void payload;
    return;
  }
}

export function createEmailProvider(): EmailProvider {
  const env = loadServerEnv();
  if (env.RESEND_API_KEY) {
    const resend = new Resend(env.RESEND_API_KEY);
    return {
      async sendEmail(payload: EmailPayload): Promise<void> {
        await resend.emails.send({
          from: env.MAIL_FROM || 'rbac@example.com',
          to: payload.to,
          subject:
            payload.template === 'reset-password' ? 'Reset your password' : 'New device login',
          html: `<p>${payload.template}</p>`,
        });
      },
    } satisfies EmailProvider;
  }
  if (env.SMTP_HOST && env.SMTP_PORT) {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
    });
    return {
      async sendEmail(payload: EmailPayload): Promise<void> {
        await transporter.sendMail({
          from: env.MAIL_FROM || 'rbac@example.com',
          to: payload.to,
          subject:
            payload.template === 'reset-password' ? 'Reset your password' : 'New device login',
          html: `<p>${payload.template}</p>`,
        });
      },
    } satisfies EmailProvider;
  }
  return new DevMailpitProvider();
}
