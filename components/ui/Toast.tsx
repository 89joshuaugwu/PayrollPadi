"use client";

import { Toaster } from "react-hot-toast";

export default function Toast() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#FFFFFF",
          color: "#0F172A",
          border: "1px solid #E2E8F0",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#16A34A", secondary: "#FFFFFF" } },
        error: { iconTheme: { primary: "#DC2626", secondary: "#FFFFFF" } },
      }}
    />
  );
}
