import { loadServerEnv } from '@rbac-boilerplate/config';

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
    // Placeholder for Resend provider wiring
    return new DevMailpitProvider();
  }
  return new DevMailpitProvider();
}
