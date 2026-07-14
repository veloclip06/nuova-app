import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/wordmark";
import { t, tList } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("meta.privacy.title"),
};

// Full privacy policy (§9). Company data (ragione sociale, address, VAT) is a
// marked [DA COMPLETARE] placeholder in it.json until the entity exists —
// completing it is a step in STRIPE_SETUP.md.
export default function PrivacyPage() {
  const contactEmail = t("privacy.contactEmail");
  const sections = tList<{ title: string; body: string }>("privacy.sections");

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[720px] items-center px-4 py-4 sm:px-8">
          <Link href="/" className="rounded-sm">
            <Wordmark />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-12 sm:px-8">
        <p className="eyebrow text-muted-foreground">{t("common.privacy")}</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightDisplay text-ink">
          {t("privacy.title")}
        </h1>
        <p className="mt-2 text-2xs text-muted-foreground">{t("privacy.updated")}</p>

        {sections.map((section) => (
          <section key={section.title} className="mt-8 border-t border-line pt-8">
            <h2 className="font-display text-lg font-semibold text-ink">{section.title}</h2>
            <p className="mt-3 max-w-[68ch] text-base text-ink">{section.body}</p>
          </section>
        ))}

        <section className="mt-8 border-t border-line pt-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("privacy.deleteTitle")}
          </h2>
          <p className="mt-3 max-w-[68ch] text-base text-ink">
            {t("privacy.deleteBody")}{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="rounded-sm text-brand underline underline-offset-2 transition-colors hover:text-brand-hover"
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
