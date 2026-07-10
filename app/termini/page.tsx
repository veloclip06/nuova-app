import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { t, tList } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("meta.termini.title"),
};

// Terms of service (§9). Same skeleton as /privacy; company data and the
// competent court are marked [DA COMPLETARE] placeholders in it.json —
// completing them is a step in STRIPE_SETUP.md.
export default function TerminiPage() {
  const contactEmail = t("termini.contactEmail");
  const sections = tList<{ title: string; body: string }>("termini.sections");

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
        <p className="eyebrow text-muted-foreground">{t("common.termini")}</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tightDisplay text-ink">
          {t("termini.title")}
        </h1>
        <p className="mt-2 text-2xs text-muted-foreground">{t("termini.updated")}</p>

        {sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="font-display text-lg font-semibold text-ink">{section.title}</h2>
            <p className="mt-2 text-base text-ink">{section.body}</p>
          </section>
        ))}

        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("termini.contactTitle")}
          </h2>
          <p className="mt-2 text-base text-ink">
            {t("termini.contactBody")}{" "}
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
