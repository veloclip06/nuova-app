/**
 * CSS-gradient flag swatches in the style of the Claude Design export (no
 * image assets). All 27 EU member states are covered (flags.test.ts enforces
 * it); emblem-bearing flags are reduced to their dominant bands, cross flags
 * layer two gradients. Codes without a gradient (the EXTRA_EU sentinel) fall
 * back to a neutral swatch in the Flag component. Always decorative — the
 * country name is the accessible label.
 */
export const FLAG_GRADIENTS: Record<string, string> = {
  AT: "linear-gradient(180deg,#ed2939 0%,#ed2939 33.4%,#ffffff 33.4%,#ffffff 66.7%,#ed2939 66.7%,#ed2939 100%)",
  BE: "linear-gradient(90deg,#1d1d1b 0%,#1d1d1b 33.4%,#fdda24 33.4%,#fdda24 66.7%,#ef3340 66.7%,#ef3340 100%)",
  BG: "linear-gradient(180deg,#ffffff 0%,#ffffff 33.4%,#00966e 33.4%,#00966e 66.7%,#d62612 66.7%,#d62612 100%)",
  CY: "linear-gradient(180deg,#ffffff 0%,#ffffff 36%,#d47600 36%,#d47600 64%,#ffffff 64%,#ffffff 100%)",
  CZ: "linear-gradient(90deg,#11457e 0%,#11457e 36%,transparent 36%),linear-gradient(180deg,#ffffff 0%,#ffffff 50%,#d7141a 50%,#d7141a 100%)",
  DE: "linear-gradient(180deg,#1d1d1b 0%,#1d1d1b 33.4%,#c8102e 33.4%,#c8102e 66.7%,#ffcc00 66.7%,#ffcc00 100%)",
  DK: "linear-gradient(90deg,transparent 0%,transparent 30%,#ffffff 30%,#ffffff 44%,transparent 44%),linear-gradient(180deg,transparent 0%,transparent 40%,#ffffff 40%,#ffffff 60%,transparent 60%),linear-gradient(180deg,#c8102e 0%,#c8102e 100%)",
  EE: "linear-gradient(180deg,#0072ce 0%,#0072ce 33.4%,#1d1d1b 33.4%,#1d1d1b 66.7%,#ffffff 66.7%,#ffffff 100%)",
  ES: "linear-gradient(180deg,#aa151b 0%,#aa151b 25%,#f1bf00 25%,#f1bf00 75%,#aa151b 75%,#aa151b 100%)",
  FI: "linear-gradient(90deg,transparent 0%,transparent 30%,#003580 30%,#003580 46%,transparent 46%),linear-gradient(180deg,transparent 0%,transparent 40%,#003580 40%,#003580 62%,transparent 62%),linear-gradient(180deg,#ffffff 0%,#ffffff 100%)",
  FR: "linear-gradient(90deg,#003d8f 0%,#003d8f 33.4%,#ffffff 33.4%,#ffffff 66.7%,#e1000f 66.7%,#e1000f 100%)",
  GR: "linear-gradient(180deg,#0d5eaf 0%,#0d5eaf 20%,#ffffff 20%,#ffffff 40%,#0d5eaf 40%,#0d5eaf 60%,#ffffff 60%,#ffffff 80%,#0d5eaf 80%,#0d5eaf 100%)",
  HR: "linear-gradient(180deg,#ff0000 0%,#ff0000 33.4%,#ffffff 33.4%,#ffffff 66.7%,#171796 66.7%,#171796 100%)",
  HU: "linear-gradient(180deg,#ce2939 0%,#ce2939 33.4%,#ffffff 33.4%,#ffffff 66.7%,#477050 66.7%,#477050 100%)",
  IE: "linear-gradient(90deg,#169b62 0%,#169b62 33.4%,#ffffff 33.4%,#ffffff 66.7%,#ff883e 66.7%,#ff883e 100%)",
  IT: "linear-gradient(90deg,#008c45 0%,#008c45 33.4%,#ffffff 33.4%,#ffffff 66.7%,#cd212a 66.7%,#cd212a 100%)",
  LT: "linear-gradient(180deg,#fdb913 0%,#fdb913 33.4%,#006a44 33.4%,#006a44 66.7%,#c1272d 66.7%,#c1272d 100%)",
  LU: "linear-gradient(180deg,#ed2939 0%,#ed2939 33.4%,#ffffff 33.4%,#ffffff 66.7%,#00a1de 66.7%,#00a1de 100%)",
  LV: "linear-gradient(180deg,#9e3039 0%,#9e3039 40%,#ffffff 40%,#ffffff 60%,#9e3039 60%,#9e3039 100%)",
  MT: "linear-gradient(90deg,#ffffff 0%,#ffffff 50%,#cf142b 50%,#cf142b 100%)",
  NL: "linear-gradient(180deg,#ae1c28 0%,#ae1c28 33.4%,#ffffff 33.4%,#ffffff 66.7%,#21468b 66.7%,#21468b 100%)",
  PL: "linear-gradient(180deg,#ffffff 0%,#ffffff 50%,#dc143c 50%,#dc143c 100%)",
  PT: "linear-gradient(90deg,#046a38 0%,#046a38 40%,#da291c 40%,#da291c 100%)",
  RO: "linear-gradient(90deg,#002b7f 0%,#002b7f 33.4%,#fcd116 33.4%,#fcd116 66.7%,#ce1126 66.7%,#ce1126 100%)",
  SE: "linear-gradient(90deg,transparent 0%,transparent 30%,#ffcd00 30%,#ffcd00 46%,transparent 46%),linear-gradient(180deg,transparent 0%,transparent 40%,#ffcd00 40%,#ffcd00 62%,transparent 62%),linear-gradient(180deg,#004b87 0%,#004b87 100%)",
  SI: "linear-gradient(180deg,#ffffff 0%,#ffffff 33.4%,#005ce5 33.4%,#005ce5 66.7%,#ed1c24 66.7%,#ed1c24 100%)",
  SK: "linear-gradient(180deg,#ffffff 0%,#ffffff 33.4%,#0b4ea2 33.4%,#0b4ea2 66.7%,#ee1c25 66.7%,#ee1c25 100%)",
};
