import nodemailer from "nodemailer";
import type { EmailSender } from "./email.interface.js";

export interface NodemailerConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export function createNodemailerSender(config: NodemailerConfig): EmailSender {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    auth: { user: config.user, pass: config.password },
    secure: config.port === 465,
  });

  return {
    async send({ to, subject, html }) {
      await transporter.sendMail({ from: config.from, to, subject, html });
    },
  };
}
