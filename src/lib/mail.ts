import nodemailer from "nodemailer";

export const mailConfigured = !!process.env.SMTP_HOST;

const transport = mailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// الروابط تُحوَّل سطرًا سطرًا قبل الدمج حتى لا يلتصق الرابط بالسطر التالي
function toHtml(text: string) {
  return text
    .split("\n")
    .map((line) => esc(line).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#a99cff">$1</a>'))
    .join("<br>");
}

type MailOptions = { action?: { label: string; url: string }; fallback?: string; footer?: string };

// قالب بهوية Nexora: خلفية كحلية، شعار، زر متدرّج. جداول وأنماط مضمّنة لأنها ما تدعمه كل برامج البريد،
// ولون ثابت قبل كل تدرّج لبرامج لا تعرض التدرّجات (مثل Outlook)
function template(text: string, dir: "ltr" | "rtl", o: MailOptions) {
  const site = process.env.APP_URL || "";
  const body = o.action ? text.split("\n").filter((l) => !l.includes(o.action!.url)).join("\n") : text;
  const align = dir === "rtl" ? "right" : "left";
  const tagline = dir === "rtl" ? "قصص تتجاوز الواقع" : "STORIES BEYOND REALITY";
  const font = "'Segoe UI',Tahoma,Arial,Helvetica,sans-serif";
  const button = o.action
    ? `<tr><td align="center" style="padding:4px 0 28px">
<a href="${esc(o.action.url)}" style="display:inline-block;background-color:#6d5dfc;background-image:linear-gradient(90deg,#8b5cf6,#3b82f6,#22d3ee);color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 34px;border-radius:10px">${esc(o.action.label)}</a></td></tr>
<tr><td style="font-size:12px;color:#8a8fb0;padding-bottom:6px">${esc(o.fallback || "")}</td></tr>
<tr><td style="font-size:12px;word-break:break-all;padding-bottom:4px" dir="ltr"><a href="${esc(o.action.url)}" style="color:#a99cff;text-decoration:underline">${esc(o.action.url)}</a></td></tr>`
    : "";
  return `<!doctype html><html lang="${dir === "rtl" ? "ar" : "en"}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"></head>
<body style="margin:0;padding:0;background-color:#03040c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#03040c;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
<tr><td align="center" style="padding-bottom:22px">
<a href="${esc(site || "#")}" style="text-decoration:none"><img src="${esc(site)}/icon-192.png" width="56" height="56" alt="Nexora" style="display:block;border:0;border-radius:14px"></a>
<div style="font-family:${font};color:#ffffff;font-size:20px;letter-spacing:6px;font-weight:bold;padding-top:12px">NEX<span style="color:#a99cff">ORA</span></div>
<div style="font-family:${font};color:#6f7393;font-size:${dir === "rtl" ? "12px" : "10px;letter-spacing:3px"};padding-top:4px">${tagline}</div>
</td></tr>
<tr><td style="background-color:#0d1022;border:1px solid #1f2340;border-radius:16px;font-family:${font};color:#e6e7f2;text-align:${align}" dir="${dir}">
<div style="height:3px;line-height:3px;font-size:0;background-color:#7c5cff;background-image:linear-gradient(90deg,#8b5cf6,#3b82f6,#22d3ee);border-radius:16px 16px 0 0">&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 28px 24px">
<tr><td style="font-size:15px;line-height:1.9;color:#e6e7f2;padding-bottom:24px">${toHtml(body)}</td></tr>
${button}
</table></td></tr>
<tr><td align="center" style="font-family:${font};font-size:11px;line-height:1.7;color:#6f7393;padding:20px 16px 0">${esc(o.footer || "")}<br>© ${new Date().getFullYear()} Nexora</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendMail(to: string, subject: string, text: string, dir: "ltr" | "rtl" = "ltr", o: MailOptions = {}) {
  if (!transport) {
    // بدون SMTP: تُطبع الرسالة في سجل الخادم (للتطوير)
    console.log(`\n[mail] to: ${to}\n[mail] ${subject}\n${text}\n`);
    return;
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from,
    replyTo: from,
    to,
    subject,
    text: o.footer ? `${text}\n\n—\n${o.footer}` : text,
    html: template(text, dir, o),
  });
}
