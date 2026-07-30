import { createNodemailerSender } from "./nodemailer.sender.js";
import { createResendSender } from "./resend.sender.js";
import type { EmailSender } from "./email.interface.js";

export type EmailSenderConfig =
  | {
      provider: "nodemailer";
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
    }
  | {
      provider: "resend";
      apiKey: string;
      from: string;
    };

export function createEmailSender(config: EmailSenderConfig): EmailSender {
  switch (config.provider) {
    case "nodemailer":
      return createNodemailerSender({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        from: config.from,
      });
    case "resend":
      return createResendSender({ apiKey: config.apiKey, from: config.from });
  }
}
