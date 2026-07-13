import { formatNaira } from "@/lib/tax-engine";
import { formatPeriod } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://payrollpadi.vercel.app";

const INDIGO = "#4F46E5";
const INDIGO_DARK = "#4338CA";
const GOLD = "#D4A017";
const GOLD_LIGHT = "#FCD34D";
const SLATE_900 = "#0F172A";
const SLATE_500 = "#64748B";
const SLATE_200 = "#E2E8F0";
const OFF_WHITE = "#F8FAFC";

/**
 * Shared email shell — table-based layout with inline styles throughout,
 * since most email clients (Outlook especially) don't support modern CSS
 * like flexbox/grid or external stylesheets. This is the standard approach
 * for HTML email compatibility.
 */
function emailShell(bodyHtml: string, preheader: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PayrollPadi</title>
</head>
<body style="margin:0; padding:0; background-color:${OFF_WHITE}; font-family: Arial, Helvetica, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${OFF_WHITE}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#FFFFFF; border-radius:16px; overflow:hidden; border:1px solid ${SLATE_200};">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${INDIGO}, ${INDIGO_DARK}); background-color:${INDIGO}; padding: 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;">
                    <div style="width:32px; height:32px; background-color:${GOLD}; border-radius:8px; text-align:center; line-height:32px; font-weight:bold; color:#FFFFFF; font-size:16px;">P</div>
                  </td>
                  <td style="color:#FFFFFF; font-size:20px; font-weight:bold; font-family: Arial, Helvetica, sans-serif;">PayrollPadi</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top:1px solid ${SLATE_200}; background-color:${OFF_WHITE};">
              <p style="margin:0; font-size:12px; color:${SLATE_500}; font-family: Arial, Helvetica, sans-serif;">
                This is an automated message from PayrollPadi. Please do not reply directly to this email.
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

function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color:${INDIGO}; border-radius:8px;">
          <a href="${href}" target="_blank" style="display:inline-block; padding: 12px 24px; font-size:14px; font-weight:bold; color:#FFFFFF; text-decoration:none; font-family: Arial, Helvetica, sans-serif;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

export interface PayslipEmailData {
  employeeName: string;
  period: string; // "2026-08"
  netPay: number;
}

export function buildPayslipEmailHtml(data: PayslipEmailData): string {
  const body = `
    <p style="margin:0 0 4px 0; font-size:14px; color:${SLATE_500}; font-family: Arial, Helvetica, sans-serif;">
      Hi ${data.employeeName},
    </p>
    <h1 style="margin:8px 0 16px 0; font-size:20px; color:${SLATE_900}; font-family: Arial, Helvetica, sans-serif;">
      Your payslip for ${formatPeriod(data.period)} is ready
    </h1>
    <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:${SLATE_500}; font-family: Arial, Helvetica, sans-serif;">
      The full breakdown is attached as a PDF to this email. Here's the headline figure:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT}); background-color:${GOLD}; border-radius:12px; margin-bottom: 8px;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="margin:0 0 4px 0; font-size:12px; font-weight:bold; letter-spacing:0.05em; color:#FFFFFF; font-family: Arial, Helvetica, sans-serif;">NET PAY</p>
          <p style="margin:0; font-size:26px; font-weight:bold; color:#FFFFFF; font-family: Arial, Helvetica, sans-serif;">${formatNaira(data.netPay)}</p>
        </td>
      </tr>
    </table>

    ${button("View in PayrollPadi", `${APP_URL}/dashboard/my-payslips`)}

    <p style="margin: 20px 0 0 0; font-size:13px; line-height:1.6; color:${SLATE_500}; font-family: Arial, Helvetica, sans-serif;">
      You can also download this payslip anytime from your <strong>My Payslips</strong> page after logging in.
    </p>
  `;
  return emailShell(body, `Your payslip for ${formatPeriod(data.period)} — Net Pay ${formatNaira(data.netPay)}`);
}

export function buildPayslipEmailText(data: PayslipEmailData): string {
  return `Hi ${data.employeeName},\n\nYour payslip for ${formatPeriod(data.period)} is ready. Net pay: ${formatNaira(
    data.netPay
  )}.\n\nThe full breakdown is attached as a PDF. You can also view it anytime at ${APP_URL}/dashboard/my-payslips`;
}

export interface TempPasswordEmailData {
  name: string;
  email: string;
  tempPassword: string;
}

export function buildTempPasswordEmailHtml(data: TempPasswordEmailData): string {
  const body = `
    <p style="margin:0 0 4px 0; font-size:14px; color:${SLATE_500}; font-family: Arial, Helvetica, sans-serif;">
      Hi ${data.name},
    </p>
    <h1 style="margin:8px 0 16px 0; font-size:20px; color:${SLATE_900}; font-family: Arial, Helvetica, sans-serif;">
      Welcome to PayrollPadi
    </h1>
    <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:${SLATE_500}; font-family: Arial, Helvetica, sans-serif;">
      An account has been created for you. Use the details below to log in for the first time, then change your
      password from <strong>Settings</strong>.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${OFF_WHITE}; border:1px solid ${SLATE_200}; border-radius:12px; margin-bottom: 8px;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="margin:0 0 12px 0; font-size:13px; font-family: Arial, Helvetica, sans-serif;">
            <span style="color:${SLATE_500};">Email</span><br/>
            <span style="color:${SLATE_900}; font-weight:bold;">${data.email}</span>
          </p>
          <p style="margin:0; font-size:13px; font-family: Arial, Helvetica, sans-serif;">
            <span style="color:${SLATE_500};">Temporary Password</span><br/>
            <span style="color:${SLATE_900}; font-weight:bold; font-family: 'Courier New', monospace;">${data.tempPassword}</span>
          </p>
        </td>
      </tr>
    </table>

    ${button("Log In to PayrollPadi", `${APP_URL}/auth/login`)}

    <p style="margin: 20px 0 0 0; font-size:13px; line-height:1.6; color:${SLATE_500}; font-family: Arial, Helvetica, sans-serif;">
      For your security, please change this password as soon as you log in.
    </p>
  `;
  return emailShell(body, `Your PayrollPadi account is ready — log in to get started`);
}

export function buildTempPasswordEmailText(data: TempPasswordEmailData): string {
  return `Hi ${data.name}, an account has been created for you on PayrollPadi.\n\nEmail: ${data.email}\nTemporary password: ${data.tempPassword}\n\nLog in at ${APP_URL}/auth/login and change your password from Settings.`;
}
