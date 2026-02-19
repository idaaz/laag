import { } from "next/navigation";

import { ProtectedShell } from "@/components/structure/ProtectedShell";

export default async function ProtectedLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  // Hardcoded Admin User for Open Access
  const user = {
    id: "27161a3b-9776-4484-b614-6ca6c18f2403",
    email: "admin@local"
  };

  return (
    <ProtectedShell initialEmail={user.email} modal={modal}>
      {children}
    </ProtectedShell>
  );
}
