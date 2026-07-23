import AppConfig from "@/config/app.config.js";

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const INK = "#111827";
const BODY_TEXT = "#4b5563";
const MUTED = "#9ca3af";
const HAIRLINE = "#e5e7eb";
const PAPER = "#f3f4f6";

export interface EmailLayoutOptions {
  title: string;
  previewText: string;
  bodyHtml: string;
}

export function emailLayout({
  title,
  previewText,
  bodyHtml,
}: EmailLayoutOptions): string {
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; width:100%; background-color:${PAPER}; -webkit-font-smoothing:antialiased;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${previewText}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER};">
      <tr>
        <td align="center" style="padding:48px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
            <tr>
              <td style="padding:0 4px 22px 4px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="width:34px; height:34px; background-color:${INK}; border-radius:9px; text-align:center; vertical-align:middle; font-family:${SANS}; font-size:17px; font-weight:700; line-height:34px; color:#ffffff;">${AppConfig.name.charAt(0)}</td>
                    <td style="padding-left:11px; font-family:${SANS}; font-size:16px; font-weight:600; letter-spacing:0.01em; color:${INK};">${AppConfig.name}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff; border:1px solid ${HAIRLINE}; border-radius:12px; padding:44px 40px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:26px 8px 0 8px;">
                <p style="margin:0 0 6px 0; font-family:${SANS}; font-size:12px; line-height:18px; color:${MUTED};">
                  This is an automated security message from ${AppConfig.name}.
                </p>
                <p style="margin:0; font-family:${SANS}; font-size:12px; line-height:18px; color:${MUTED};">
                  <a href="https://procloudd.example/help" style="color:${MUTED}; text-decoration:underline;">Help Center</a>
                  &nbsp;&middot;&nbsp;
                  <a href="https://procloudd.example/privacy" style="color:${MUTED}; text-decoration:underline;">Privacy</a>
                  &nbsp;&middot;&nbsp;
                  &copy; ${new Date().getFullYear()} ${AppConfig.name}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export { SANS, INK, BODY_TEXT, MUTED, HAIRLINE };
