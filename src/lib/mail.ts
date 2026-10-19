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

export async function sendMail(to: string, subject: string, text: string) {
  if (!transport) {
    // بدون SMTP: تُطبع الرسالة في سجل الخادم (للتطوير)
    console.log(`\n[mail] إلى: ${to}\n[mail] ${subject}\n${text}\n`);
    return;
  }
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: `<div dir="rtl" style="font-family:sans-serif;line-height:1.8">${text.replace(/\n/g, "<br>").replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>')}</div>`,
  });
}
