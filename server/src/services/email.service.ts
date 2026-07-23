import { createNodemailerSender } from "@/common/email/nodemailer.sender.js";
import type { EmailMessage } from "@/common/email/email.interface.js";
import env from "@/config/env.config.js";

const sender = createNodemailerSender({
  host: env.NODEMAILER_HOST,
  port: env.NODEMAILER_PORT,
  user: env.NODEMAILER_USER,
  password: env.NODEMAILER_PASSWORD,
  from: env.EMAIL_FROM,
});

const Email = {
  send(message: EmailMessage): Promise<void> {
    return sender.send(message);
  },
};

export default Email;
