export const dynamic = "force-dynamic";

import { ResetPasswordForm } from "@/components/admin/password-forms";

export default function AdminResetPasswordPage() {
  return (
    <main className="min-h-screen px-6 py-28">
      <ResetPasswordForm />
    </main>
  );
}