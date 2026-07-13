import nodemailer from "nodemailer";
import {
  buildPayslipEmailHtml,
  buildPayslipEmailText,
  buildTempPasswordEmailHtml,
  buildTempPasswordEmailText,
  PayslipEmailData,
} from "@/lib/email-templates";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_SMTP_USER,
      pass: process.env.GMAIL_SMTP_APP_PASSWORD, // 16-digit Gmail app password — a regular password fails silently
    },
  });
  return transporter;
}

export async function sendPayslipEmail(
  toEmail: string,
  pdfBuffer: Buffer,
  data: PayslipEmailData
): Promise<void> {
  await getTransporter().sendMail({
    from: `"PayrollPadi" <${process.env.GMAIL_SMTP_USER}>`,
    to: toEmail,
    subject: "Your Payslip is Ready",
    text: buildPayslipEmailText(data),
    html: buildPayslipEmailHtml(data),
    attachments: [{ filename: "payslip.pdf", content: pdfBuffer }],
  });
}

export async function sendTempPasswordEmail(toEmail: string, name: string, tempPassword: string): Promise<void> {
  const data = { name, email: toEmail, tempPassword };
  await getTransporter().sendMail({
    from: `"PayrollPadi" <${process.env.GMAIL_SMTP_USER}>`,
    to: toEmail,
    subject: "Your PayrollPadi Account",
    text: buildTempPasswordEmailText(data),
    html: buildTempPasswordEmailHtml(data),
  });
}
