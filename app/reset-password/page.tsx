import { ScaffoldPlaceholder } from "@/components/scaffold-placeholder";

// Password reset (Supabase Auth).
export default function ResetPasswordPage() {
  return (
    <ScaffoldPlaceholder
      eyebrow="Recupero accesso"
      title="Reimposta la password"
      description="Invia il link di reimpostazione via email (Supabase Auth)."
    />
  );
}
