export const dynamic = "force-dynamic";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminContentSnapshot } from "@/lib/cms";
import { requireAdminPage } from "@/lib/security/admin-auth";

export default async function AdminPage() {
  const admin = await requireAdminPage({ next: "/admin", requireMfa: true });
  const { data: sessionData } = await admin.supabase.auth.getSession();
  const content = await getAdminContentSnapshot();

  return (
    <main className="min-h-screen">
      <AdminDashboard
        content={content}
        email={admin.user.email ?? undefined}
        accessToken={sessionData.session?.access_token}
      />
    </main>
  );
}
