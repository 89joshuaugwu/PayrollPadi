import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a payslip PDF to Cloudinary and returns its secure URL.
 * Best-effort / optional per CONTEXT.md Section 7 — callers must not let
 * a failure here block payroll lock or email delivery.
 */
export async function uploadPayslipPdf(pdfBuffer: Buffer, publicId: string): Promise<string> {
  const base64 = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(base64, {
    resource_type: "raw",
    folder: "payrollpadi/payslips",
    public_id: publicId,
    overwrite: true,
  });
  return result.secure_url;
}
