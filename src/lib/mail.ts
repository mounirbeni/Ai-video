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

export async function sendMail(to: string, subject: string, text: string, dir: "ltr" | "rtl" = "ltr") {
  if (!transport) {
    // بدون SMTP: تُطبع الرسالة في سجل الخادم (للتطوير)
    console.log(`\n[mail] to: ${to}\n[mail] ${subject}\n${text}\n`);
    return;
  }
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: `<div dir="${dir}" style="font-family:sans-serif;line-height:1.8">${toHtml(text)}</div>`,
  });
}
