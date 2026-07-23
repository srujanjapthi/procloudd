import {
  SANS,
  INK,
  BODY_TEXT,
  MUTED,
  HAIRLINE,
  emailLayout,
} from "./base.template.js";
import AppConfig from "@/config/app.config.js";

export interface OtpEmailOptions {
  otp: string;
  expiryMinutes: number;
}

export function otpEmail({ otp, expiryMinutes }: OtpEmailOptions): {
  subject: string;
  html: string;
} {
  const bodyHtml = `
    <h1 style="margin:0 0 12px 0; font-family:${SANS}; font-size:23px; font-weight:700; line-height:1.3; color:${INK};">
      Confirm it's you
    </h1>
    <p style="margin:0 0 30px 0; font-family:${SANS}; font-size:15px; line-height:24px; color:${BODY_TEXT};">
      Enter the verification code below to finish signing in to your ${AppConfig.name} account.
    </p>
    <table role="presentation" width="280" cellpadding="0" cellspacing="0" border="0" align="center" style="width:280px; margin:0 auto 18px auto; mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse;">
      <tr>
        <td width="280" align="center" style="width:280px; padding:20px 12px; background-color:#f9fafb; border:1px solid ${HAIRLINE}; border-radius:12px; mso-line-height-rule:exactly;">
          <span style="font-family:'SF Mono', 'Consolas', 'Menlo', monospace; font-size:34px; font-weight:700; letter-spacing:10px; color:${INK};">${otp}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 32px 0; text-align:center; font-family:${SANS}; font-size:13px; line-height:20px; color:${MUTED};">
      This code expires in <span style="color:${INK}; font-weight:600;">${expiryMinutes} minutes</span>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="border-top:1px solid ${HAIRLINE}; font-size:0; line-height:0;">&nbsp;</td></tr>
    </table>
    <p style="margin:22px 0 0 0; font-family:${SANS}; font-size:13px; line-height:21px; color:${MUTED};">
      Didn't try to sign in? You can safely ignore this email &mdash; no changes have been made to your account.
    </p>`;

  return {
    subject: `Your ${AppConfig.name} verification code`,
    html: emailLayout({
      title: "Verification code",
      previewText: `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,
      bodyHtml,
    }),
  };
}
