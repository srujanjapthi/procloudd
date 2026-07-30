import { createEmailSender } from "@/common/email/email-sender.factory.js";
import type { EmailMessage } from "@/common/email/email.interface.js";
import env from "@/config/env.config.js";

const sender = createEmailSender(env.email);

const Email = {
  send(message: EmailMessage): Promise<void> {
    return sender.send(message);
  },
};

export default Email;
