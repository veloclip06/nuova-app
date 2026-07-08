import { tList, t } from "@/lib/i18n";

/**
 * "Il dolore" — three concrete situations sellers hit (DESIGN_SYSTEM.md §8.3,
 * loss aversion used honestly: real facts, official sources, never inflated).
 * Rules are still `status: draft`, so the note says "consultate", never
 * "verificato" (STATO_PROGETTO decision #3).
 */
interface PainItem {
  title: string;
  body: string;
  source: { label: string; url: string };
}

export function PainSection() {
  const items = tList<PainItem>("landing.pain.items");

  return (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[1080px]">
        <p className="eyebrow text-muted-foreground">{t("landing.pain.eyebrow")}</p>
        <h2 className="mt-3 max-w-[20ch] font-display text-2xl font-bold tracking-tightDisplay sm:text-3xl">
          {t("landing.pain.title")}
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((item, i) => (
            <article
              key={item.title}
              className="flex flex-col rounded-lg border border-line bg-surface p-6"
            >
              <span className="font-mono text-2xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-xs text-muted-foreground">{item.body}</p>
              <a
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-sm font-mono text-2xs text-brand hover:underline"
              >
                {t("common.source")}: {item.source.label} ↗
              </a>
            </article>
          ))}
        </div>

        <p className="mt-6 font-mono text-2xs text-muted-foreground">
          {t("landing.pain.note")}
        </p>
      </div>
    </section>
  );
}
