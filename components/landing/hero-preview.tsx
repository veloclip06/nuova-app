import { Seal, type SealStatus } from "@/components/seal";
import { Flag } from "@/components/checker/flag";
import { getCoveredCountries } from "@/lib/rules/coverage";
import { t } from "@/lib/i18n";

/**
 * Decorative product preview from the Claude Design export ("Landing hero"):
 * a browser window framing a checker result with status seals. Reuses the
 * real Seal + Flag so what visitors see is the actual product signature (§5),
 * not a throwaway mock. Purely presentational, hidden from assistive tech.
 *
 * The countries and registers shown come from /rules (server component):
 * coverage is data, never hardcoded in the UI. Statuses and tilts stay
 * decorative, cycling over the export's original pattern.
 */
const PREVIEW_STATUSES: SealStatus[] = ["esposto", "esposto", "non_obbligato"];
const PREVIEW_TILTS = [-2, -1.2, -1.6];

/** Render digits in mono — "i numeri sono il prodotto" (DESIGN_SYSTEM.md §4). */
function MonoDigits({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+)/).map((part, i) =>
        /^\d+$/.test(part) ? (
          <span key={i} className="font-mono">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function HeroPreview() {
  // First three covered countries — the export's layout shows three cards.
  const previewCountries = getCoveredCountries().slice(0, 3);
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
                n: previewCountries.filter(
                  (_, index) => PREVIEW_STATUSES[index % PREVIEW_STATUSES.length] === "esposto",
                ).length,
                total: previewCountries.length,
              })}
            />
          </p>
        </div>

        {/* Country cards */}
        <div className="grid grid-cols-1 gap-3 bg-paper p-5 sm:grid-cols-3">
          {previewCountries.map(({ code, registerName }, index) => (
            <div
              key={code}
              className="flex flex-col gap-2.5 rounded-md border border-line bg-surface p-3.5"
            >
              <div className="flex items-center gap-1.5">
                <Flag code={code} size="sm" />
                <span className="font-display text-[9px] font-semibold uppercase tracking-register">
                  {registerName}
                </span>
              </div>
              <Seal
                status={PREVIEW_STATUSES[index % PREVIEW_STATUSES.length]}
                tilt={PREVIEW_TILTS[index % PREVIEW_TILTS.length]}
              />
              <div className="mt-1 flex flex-col gap-1.5">
                <span className="h-1 w-[92%] rounded-full bg-line/70" />
                <span className="h-1 w-[68%] rounded-full bg-line/70" />
                <span className="h-1 w-1/2 rounded-full bg-line/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3.5 text-center text-2xs text-muted-foreground">
        {t("landing.preview.caption")}
      </p>
    </div>
  );
}
