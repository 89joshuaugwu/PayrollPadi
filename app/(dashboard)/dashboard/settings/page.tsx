"use client";

import { useEffect, useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

const DEFAULT_COMPANY_NAME = "PayrollPadi";

export default function SettingsPage() {
  const { profile, firebaseUser } = useAuth();
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);
  const [companyNameLoaded, setCompanyNameLoaded] = useState(false);
  const [savingCompanyName, setSavingCompanyName] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "company"))
      .then((snap) => {
        const name = snap.exists() ? (snap.data().companyName as string | undefined) : undefined;
        if (name) setCompanyName(name);
      })
      .catch((err) => console.error("Failed to load company name:", err))
      .finally(() => setCompanyNameLoaded(true));
  }, []);

  async function handleSaveCompanyName() {
    if (!firebaseUser) return;
    if (!companyName.trim()) {
      toast.error("Company name can't be empty.");
      return;
    }
    setSavingCompanyName(true);
    try {
      await setDoc(doc(db, "settings", "company"), {
        companyName: companyName.trim(),
        updatedAt: Timestamp.now(),
        updatedBy: firebaseUser.uid,
      });
      toast.success("Company name saved — new payslip PDFs will use it.");
    } catch {
      toast.error("Failed to save company name.");
    } finally {
      setSavingCompanyName(false);
    }
  }

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
          disabled={!companyNameLoaded}
        />
        <p className="text-xs text-text-secondary mt-2">
          Applies to every payslip PDF generated after saving — locked runs already emailed keep whatever name was
          in effect when they were sent, same immutability principle as everything else on a locked payslip.
        </p>
        <div className="flex justify-end mt-3">
          <Button onClick={handleSaveCompanyName} loading={savingCompanyName} disabled={!companyNameLoaded}>
            Save Company Name
          </Button>
        </div>
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
