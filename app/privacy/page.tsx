import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("meta.privacy.title"),
};

// Minimal honest privacy placeholder: the checker's footer links here while
// collecting emails, so the page must exist and say the truth. The complete
// policy replaces this in PROMPT 6.
export default function PrivacyPage() {
  const contactEmail = t("privacy.contactEmail");
  const sections: Array<[string, string]> = [
    [t("privacy.whoTitle"), t("privacy.whoBody")],
    [t("privacy.whatTitle"), t("privacy.whatBody")],
    [t("privacy.whyTitle"), t("privacy.whyBody")],
    [t("privacy.sharingTitle"), t("privacy.sharingBody")],
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[720px] items-center px-4 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 rounded-sm">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px] bg-brand" />
            <span className="font-display text-2xs font-bold uppercase tracking-[0.1em] text-ink">
              {t("common.appName")}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-12 sm:px-8">
        <p className="eyebrow text-muted-foreground">{t("common.privacy")}</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightDisplay text-ink">
          {t("privacy.title")}
        </h1>
        <p className="mt-2 text-2xs text-muted-foreground">{t("privacy.updated")}</p>

        {sections.map(([title, body]) => (
          <section key={title} className="mt-8">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-base text-ink">{body}</p>
          </section>
        ))}

        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("privacy.deleteTitle")}
          </h2>
          <p className="mt-2 text-base text-ink">
            {t("privacy.deleteBody")}{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="rounded-sm text-brand hover:underline"
            >
              {contactEmail}
            </a>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
