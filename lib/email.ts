import nodemailer from "nodemailer";
import { PayslipResult } from "@/types/payslip";
import { formatNaira } from "@/lib/tax-engine";

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
  payslip: PayslipResult
): Promise<void> {
  await getTransporter().sendMail({
    from: `"PayrollPadi" <${process.env.GMAIL_SMTP_USER}>`,
    to: toEmail,
    subject: "Your Payslip is Ready",
    text: `Hi, your payslip for this period is attached. Net pay: ${formatNaira(payslip.netPay)}`,
    attachments: [{ filename: "payslip.pdf", content: pdfBuffer }],
  });
}

export async function sendTempPasswordEmail(toEmail: string, name: string, tempPassword: string): Promise<void> {
  await getTransporter().sendMail({
    from: `"PayrollPadi" <${process.env.GMAIL_SMTP_USER}>`,
    to: toEmail,
    subject: "Your PayrollPadi Account",
    text: `Hi ${name}, an account has been created for you on PayrollPadi.\n\nEmail: ${toEmail}\nTemporary password: ${tempPassword}\n\nLog in at ${process.env.NEXT_PUBLIC_APP_URL}/auth/login and change your password from Settings.`,
  });
}
