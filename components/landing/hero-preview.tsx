import { Seal, type SealStatus } from "@/components/seal";
import { Flag } from "@/components/checker/flag";
import { MonoDigits } from "@/components/mono-digits";
import { FLAG_GRADIENTS } from "@/lib/checker/flags";
import { t } from "@/lib/i18n";

/**
 * Decorative product preview from the Claude Design export ("Landing hero"):
 * a browser window framing a checker result with status seals. Purely
 * presentational, hidden from assistive tech.
 *
 * EU-neutral by design (decision ratified 2026-07-10): the result cards are
 * anonymised — skeleton flag and register, real Seal (§5) — so no country
 * reads as the product's perimeter. The uniform strip of all 27 EU flags
 * under the window carries the actual message: the check starts from
 * wherever you sell. Statuses and tilts mirror the export's pattern.
 */
const PREVIEW_CARDS: { status: SealStatus; tilt: number }[] = [
  { status: "esposto", tilt: -2 },
  { status: "esposto", tilt: -1.2 },
  { status: "non_obbligato", tilt: -1.6 },
];

/** All 27 EU flags, uniform and alphabetical — no country stands out. */
const EU_CODES = Object.keys(FLAG_GRADIENTS);

export function HeroPreview() {
  const exposed = PREVIEW_CARDS.filter((c) => c.status === "esposto").length;
  return (
    <div aria-hidden="true" className="mx-auto mt-14 w-full max-w-[880px]">
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_32px_64px_-48px_rgba(23,36,47,0.45)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-line bg-paper px-3.5 py-2.5">
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="mx-auto font-mono text-[11px] text-muted-foreground">
            {t("landing.preview.url")}
          </span>
          <span className="w-9" />
        </div>

        {/* Result header (ink) */}
        <div className="bg-ink px-5 py-4 text-paper">
          <p className="eyebrow text-[9px] text-paper/60">
            {t("landing.preview.kicker")}
          </p>
          <p className="mt-1 font-display text-base font-semibold">
            {t("landing.preview.title")}
          </p>
          <p className="mt-0.5 text-2xs text-paper/80">
            <MonoDigits
              text={t("landing.preview.summary", {
                n: exposed,
                total: PREVIEW_CARDS.length,
              })}
            />
          </p>
        </div>

        {/* Anonymised country cards — the seal is the only "real" element */}
        <div className="grid grid-cols-1 gap-3 bg-paper p-5 sm:grid-cols-3">
          {PREVIEW_CARDS.map(({ status, tilt }, index) => (
            <div
              key={index}
              className="flex flex-col gap-2.5 rounded-md border border-line bg-surface p-3.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-[15px] w-[22px] shrink-0 rounded-[3px] border border-ink/10 bg-line" />
                <span className="h-1.5 w-16 rounded-full bg-line" />
              </div>
              <Seal status={status} tilt={tilt} />
              <div className="mt-1 flex flex-col gap-1.5">
                <span className="h-1 w-[92%] rounded-full bg-line/70" />
                <span className="h-1 w-[68%] rounded-full bg-line/70" />
                <span className="h-1 w-1/2 rounded-full bg-line/50" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The whole EU, uniformly — coverage details live in the check + FAQ */}
      <div className="mx-auto mt-6 flex max-w-[720px] flex-wrap items-center justify-center gap-1.5">
        {EU_CODES.map((code) => (
          <Flag key={code} code={code} className="h-[11px] w-4 rounded-[2px]" />
        ))}
      </div>
      <p className="mt-2.5 text-center text-2xs text-muted-foreground">
        {t("landing.preview.caption")}
      </p>
    </div>
  );
}
