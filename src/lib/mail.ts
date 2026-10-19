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
    .map((line) => esc(line).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>'))
    .join("<br>");
}

type MailOptions = { action?: { label: string; url: string }; fallback?: string; footer?: string };

// قالب بسيط بجداول وأنماط مضمّنة (تدعمه كل برامج البريد) — رسالة منسّقة بزر واضح ونص بديل
// تقلّل احتمال تصنيفها رسالة مزعجة مقارنة برابط خام وحده
function template(text: string, dir: "ltr" | "rtl", o: MailOptions) {
  const body = o.action ? text.split("\n").filter((l) => !l.includes(o.action!.url)).join("\n") : text;
  const align = dir === "rtl" ? "right" : "left";
  const button = o.action
    ? `<tr><td align="center" style="padding:8px 0 24px"><a href="${esc(o.action.url)}" style="display:inline-block;background:#6d5dfc;background-image:linear-gradient(90deg,#8b5cf6,#3b82f6,#22d3ee);color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:8px">${esc(o.action.label)}</a></td></tr>
<tr><td style="font-size:12px;color:#8b8fa8;padding-bottom:4px">${esc(o.fallback || "")}</td></tr>
<tr><td style="font-size:12px;word-break:break-all;padding-bottom:16px" dir="ltr"><a href="${esc(o.action.url)}" style="color:#7c5cff">${esc(o.action.url)}</a></td></tr>`
    : "";
  return `<!doctype html><html lang="${dir === "rtl" ? "ar" : "en"}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#1d1f33;text-align:${align}" dir="${dir}">
<tr><td style="background:#05060f;border-radius:12px 12px 0 0;padding:18px 24px;text-align:center;color:#ffffff;font-size:18px;letter-spacing:4px;font-weight:bold">NEXORA</td></tr>
<tr><td style="padding:24px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:15px;line-height:1.8;padding-bottom:20px">${toHtml(body)}</td></tr>
${button}
</table></td></tr>
<tr><td style="padding:16px 24px 20px;border-top:1px solid #ececf3;font-size:11px;color:#8b8fa8;line-height:1.6">${esc(o.footer || "")}</td></tr>
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
