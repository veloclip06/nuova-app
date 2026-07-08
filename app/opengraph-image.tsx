import { ImageResponse } from "next/og";

/**
 * Social preview card (og:image + twitter:image via the file convention).
 * "Torre di controllo" look: ink surface, register wordmark, one status stamp —
 * no external assets, no fetched fonts (DESIGN_SYSTEM.md §2). Colours are the
 * raw tokens from §3; satori needs explicit display:flex on multi-child nodes.
 */
export const alt = "Cockpit EPR — obblighi imballaggi UE, chiari";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#17242F";
const PAPER = "#F7F8F6";
const BRAND = "#0E6B5C";
const RISK = "#B3261E";
const MUTED = "#5A6B76";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          color: PAPER,
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: BRAND, display: "flex" }} />
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Cockpit EPR
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.02em", maxWidth: 900 }}>
            Vendi in più paesi UE? Hai obblighi EPR in ognuno.
          </div>
          <div style={{ fontSize: 30, color: "#C6CDD2", maxWidth: 820 }}>
            Scopri in due minuti dove sei esposto e cosa fare, paese per paese.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ border: `2px solid ${RISK}`, borderRadius: 8, padding: 4, transform: "rotate(-2deg)", display: "flex" }}>
            <div
              style={{
                border: `1px solid ${RISK}`,
                borderRadius: 5,
                padding: "8px 20px",
                color: RISK,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.14em",
                display: "flex",
              }}
            >
              ESPOSTO
            </div>
          </div>
          <div style={{ fontSize: 22, color: MUTED }}>
            LUCID · Citeo · CONAI — con fonti ufficiali
          </div>
        </div>
      </div>
    ),
    size,
  );
}
