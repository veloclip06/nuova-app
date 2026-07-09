import { t } from "@/lib/i18n";

/** "oppure" divider between the OAuth button and the email/password form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-2xs text-muted-foreground">{t("app.auth.or")}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Inline form error — states what happened (DESIGN_SYSTEM.md §8.7 / §9). */
export function AuthError({ message }: { message: string }) {
  return (
    <p role="alert" className="text-2xs text-risk">
      {message}
    </p>
  );
}
