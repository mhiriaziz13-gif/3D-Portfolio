export const dynamic = "force-dynamic";

import { ForgotPasswordForm } from "@/components/admin/password-forms";

export default function AdminForgotPasswordPage() {
  return (
    <main className="min-h-screen px-6 py-28">
      <ForgotPasswordForm />
    </main>
  );
}