import { tList, t } from "@/lib/i18n";
import { MonoDigits } from "@/components/mono-digits";
import { getCoveredCountries } from "@/lib/rules/coverage";

/**
 * FAQ — real EPR questions, answers coherent with /rules (facts + official
 * sources, rules still `status: draft` so the note says "consultata", never
 * "verificato": STATO_PROGETTO decision #3). The authorised-representative
 * answer stays explicitly uncertain (memory: [[seal-semantics-ruling]] /
 * decision #1, never present an evolving obligation as settled).
 *
 * Questions are EU-framed (neutrality decision ratified 2026-07-10): named
 * countries appear only as sourced examples. The coverage answer interpolates
 * {{countries}} from /rules at render time — coverage is data, never copy.
 *
 * Uses native <details> so the accordion is keyboard/AT-accessible with no JS.
 * Emits schema.org FAQPage JSON-LD from the same data for rich results.
 */
interface FaqSource {
  label: string;
  url: string;
}
interface FaqItem {
  q: string;
  a: string;
  sources: FaqSource[];
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className="mt-1 h-3 w-3 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
      fill="none"
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Italian-style list join: "Francia, Germania e Italia". */
function joinIt(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

export function FaqSection() {
  const countries = joinIt(getCoveredCountries().map((c) => c.name));
  const items = tList<FaqItem>("landing.faq.items").map((item) => ({
    ...item,
    a: item.a.replace("{{countries}}", countries),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-8 border-t border-line px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-[760px]">
        <p className="eyebrow text-muted-foreground">{t("landing.faq.eyebrow")}</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tightDisplay sm:text-3xl">
          {t("landing.faq.title")}
        </h2>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-ink transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
                <span className="font-display text-base font-semibold">
                  {item.q}
                </span>
                <Chevron />
              </summary>
              <div className="pb-5">
                <p className="max-w-[64ch] text-xs text-muted-foreground">
                  <MonoDigits text={item.a} />
                </p>
                {item.sources.length > 0 && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-2xs">
                    <span className="text-muted-foreground">
                      {t("landing.faq.sourcesLabel")}:
                    </span>
                    {item.sources.map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm text-brand hover:underline"
                      >
                        {source.label} ↗
                      </a>
                    ))}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>

        <p className="mt-6 font-mono text-2xs text-muted-foreground">
          {t("landing.faq.note")}
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
