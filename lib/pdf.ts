import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PayeBreakdownEntry, PayslipDeductions } from "@/types/payslip";
import { SalaryStructure } from "@/types/employee";

const INDIGO: [number, number, number] = [79, 70, 229];
const GOLD: [number, number, number] = [212, 160, 23];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_900: [number, number, number] = [15, 23, 42];

function naira(n: number): string {
  return `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface PayslipPdfInput {
  employeeName: string;
  employeeIdNumber: string;
  period: string;
  earnings: SalaryStructure;
  deductions: PayslipDeductions;
  grossPay: number;
  netPay: number;
  payeBreakdown: PayeBreakdownEntry[];
  taxSettingsVersionUsed: string;
  companyName?: string;
}

/** Generates a payslip PDF matching the on-screen PayslipDetailView layout (DESIGN.md Section 6). */
export function generatePayslipPDF(input: PayslipPdfInput): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Company header
  doc.setFontSize(18);
  doc.setTextColor(...INDIGO);
  doc.setFont("helvetica", "bold");
  doc.text(input.companyName ?? "PayrollPadi", margin, 50);

  doc.setFontSize(11);
  doc.setTextColor(...SLATE_500);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Payslip for: ${input.employeeName}  |  ID: ${input.employeeIdNumber}  |  Period: ${input.period}`,
    margin,
    70
  );

  // Earnings / Deductions two-column table
  autoTable(doc, {
    startY: 90,
    margin: { left: margin, right: margin },
    head: [["EARNINGS", "AMOUNT", "DEDUCTIONS", "AMOUNT"]],
    body: [
      ["Basic Salary", naira(input.earnings.basic), "Pension", naira(input.deductions.pension)],
      ["Housing Allowance", naira(input.earnings.housing), "NHF", naira(input.deductions.nhf)],
      ["Transport Allowance", naira(input.earnings.transport), "NHIS", naira(input.deductions.nhis)],
      ["Other Allowances", naira(input.earnings.otherAllowances), "PAYE", naira(input.deductions.payeTax)],
      ["", "", "Rent Relief Applied", naira(input.deductions.rentReliefApplied)],
      ["", "", "Voluntary Deductions", naira(input.deductions.voluntary)],
    ],
    headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 6, textColor: SLATE_900 },
    columnStyles: {
      1: { halign: "right" },
      3: { halign: "right" },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let y = (doc as any).lastAutoTable.finalY + 10;

  const totalDeductions =
    input.deductions.pension +
    input.deductions.nhf +
    input.deductions.nhis +
    input.deductions.payeTax +
    input.deductions.voluntary;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: [["GROSS PAY", naira(input.grossPay), "TOTAL DEDUCTIONS", naira(totalDeductions)]],
    styles: { fontSize: 10, fontStyle: "bold", cellPadding: 6, textColor: SLATE_900 },
    columnStyles: { 1: { halign: "right" }, 3: { halign: "right" } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 25;

  // Net pay — prominent, Gold highlighted
  doc.setFillColor(...GOLD);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 44, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`NET PAY: ${naira(input.netPay)}`, pageWidth / 2, y + 28, { align: "center" });

  y += 65;

  // PAYE band breakdown
  if (input.payeBreakdown.length > 0) {
    doc.setTextColor(...SLATE_900);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PAYE Band Breakdown (Annualized)", margin, y);

    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin },
      head: [["Band Min", "Band Max", "Rate", "Tax on Band"]],
      body: input.payeBreakdown.map((b) => [
        naira(b.bandMin),
        b.bandMax !== null ? naira(b.bandMax) : "No limit",
        `${(b.rate * 100).toFixed(0)}%`,
        naira(b.taxOnBand),
      ]),
      headStyles: { fillColor: SLATE_500, textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 5 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  doc.setFontSize(8);
  doc.setTextColor(...SLATE_500);
  doc.setFont("helvetica", "italic");
  doc.text(`Tax computed using NTA 2025 bands (version ${input.taxSettingsVersionUsed})`, margin, y);

  return Buffer.from(doc.output("arraybuffer"));
}
