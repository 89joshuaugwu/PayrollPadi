"use client";

import { useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function SettingsPage() {
  const { profile } = useAuth();
  const [companyName, setCompanyName] = useState("PayrollPadi");
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setChanging(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success("Password updated.");
      setNewPassword("");
    } catch {
      toast.error("Failed to update password. You may need to log in again first.");
    } finally {
      setChanging(false);
    }
  }

  if (!profile) return <Spinner />;

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      <Card>
        <h2 className="font-semibold text-text-primary mb-4">Admin Profile</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-text-secondary text-xs">Name</dt>
            <dd className="text-text-primary">{profile.displayName}</dd>
          </div>
          <div>
            <dt className="text-text-secondary text-xs">Email</dt>
            <dd className="text-text-primary">{profile.email}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold text-text-primary mb-4">Company Info</h2>
        <Input
          label="Company Name (used in payslip PDF header)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <p className="text-xs text-text-secondary mt-2">
          Wired into the payslip PDF header — update <code>lib/pdf.ts</code>&apos;s <code>companyName</code> default
          or persist this to a <code>/settings/company</code> doc for a fully dynamic header.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold text-text-primary mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" loading={changing} className="self-start">
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
