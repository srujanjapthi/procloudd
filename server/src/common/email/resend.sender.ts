import { Resend } from "resend";
import type { EmailSender } from "./email.interface.js";

export interface ResendConfig {
  apiKey: string;
  from: string;
}

export function createResendSender(config: ResendConfig): EmailSender {
  const resend = new Resend(config.apiKey);

  return {
    async send({ to, subject, html }) {
      const { error } = await resend.emails.send({
        from: config.from,
        to,
        subject,
        html,
      });

      if (error) {
        throw new Error(`Resend email send failed: ${error.message}`);
      }
    },
  };
}
