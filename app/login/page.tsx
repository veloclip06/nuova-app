import { ScaffoldPlaceholder } from "@/components/scaffold-placeholder";

// Supabase Auth (email+password, Google). Real form in the app phase.
export default function LoginPage() {
  return (
    <ScaffoldPlaceholder
      eyebrow="Accesso"
      title="Accedi"
      description="Login con email e password o Google (Supabase Auth)."
    />
  );
}
