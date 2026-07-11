import { AuthProvider } from "@/lib/AuthContext";
import AppShell from "@/components/shells/AppShell";

// Every /dashboard/* route is client-auth-gated (see AuthProvider) and
// reads live Firebase data — there's nothing meaningful to prerender at
// build time, and doing so would require real Firebase env vars to even
// be present during `next build`.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
