/**
 * Sheet Themes — Visual identity per RPG system.
 * Each theme provides colors, typography hints, and decorative
 * accents that make the digital sheet feel like its physical counterpart.
 */

export interface SheetTheme {
  id: string;
  /** Display name shown on the sheet chrome */
  systemLabel: string;
  /** CSS custom properties applied to the sheet wrapper */
  cssVars: Record<string, string>;
  /** Tailwind classes for section headers */
  sectionHeaderClass: string;
  /** Tailwind classes for the sheet card itself */
  sheetCardClass: string;
  /** Tailwind classes for section blocks */
  sectionBlockClass: string;
  /** Tailwind classes for field labels */
  labelClass: string;
  /** Dot/circle fill color class */
  dotFilledClass: string;
  /** Dot/circle empty color class */
  dotEmptyClass: string;
  /** Accent border for the sheet */
  accentBorderClass: string;
  /** Optional decorative element */
  ornamentSvg?: string;
  /** Font family override (CSS value) */
  fontDisplay?: string;
  /** Whether to show a subtle parchment/paper texture */
  hasTexture?: boolean;
}

/** Exalted 2E — golden grandeur, sun-kissed elegance */
const exaltedTheme: SheetTheme = {
  id: "exalted",
  systemLabel: "Exalted",
  cssVars: {
    "--sheet-accent": "38 73% 45%",
    "--sheet-accent-glow": "38 80% 55%",
    "--sheet-bg": "40 30% 97%",
    "--sheet-section-bg": "38 25% 95%",
    "--sheet-border": "38 30% 80%",
    "--sheet-header-gradient": "linear-gradient(135deg, hsl(38 73% 45%), hsl(30 60% 35%))",
  },
  sectionHeaderClass:
    "text-sm font-display font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-500",
  sheetCardClass:
    "bg-[hsl(40,30%,97%)] border-amber-300/40 shadow-[0_4px_24px_hsl(38_60%_50%/0.08)]",
  sectionBlockClass:
    "rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/40 to-transparent p-5",
  labelClass: "text-[11px] font-semibold uppercase tracking-wider text-amber-800/60",
  dotFilledClass: "bg-amber-600 border-amber-700 shadow-[0_0_4px_hsl(38_60%_50%/0.3)]",
  dotEmptyClass: "bg-amber-100/60 border-amber-300/60",
  accentBorderClass: "border-amber-400/30",
  fontDisplay: "'Playfair Display', serif",
  hasTexture: true,
};

/** D&D 5e — classic crimson & parchment */
const dnd5eTheme: SheetTheme = {
  id: "dnd5e",
  systemLabel: "D&D 5e",
  cssVars: {
    "--sheet-accent": "0 60% 42%",
    "--sheet-bg": "32 30% 97%",
    "--sheet-section-bg": "32 20% 95%",
    "--sheet-border": "0 30% 80%",
  },
  sectionHeaderClass:
    "text-sm font-display font-bold uppercase tracking-[0.18em] text-red-800",
  sheetCardClass:
    "bg-[hsl(32,30%,97%)] border-red-300/30 shadow-[0_4px_24px_hsl(0_40%_40%/0.06)]",
  sectionBlockClass:
    "rounded-xl border border-red-200/40 bg-gradient-to-br from-red-50/30 to-transparent p-5",
  labelClass: "text-[11px] font-semibold uppercase tracking-wider text-red-900/50",
  dotFilledClass: "bg-red-700 border-red-800",
  dotEmptyClass: "bg-red-100/50 border-red-300/50",
  accentBorderClass: "border-red-400/30",
  fontDisplay: "'Playfair Display', serif",
  hasTexture: true,
};

/** Call of Cthulhu 7e — eldritch green & aged paper */
const coc7eTheme: SheetTheme = {
  id: "coc7e",
  systemLabel: "Call of Cthulhu 7e",
  cssVars: {
    "--sheet-accent": "150 35% 30%",
    "--sheet-bg": "80 10% 96%",
    "--sheet-section-bg": "80 8% 94%",
    "--sheet-border": "150 20% 75%",
  },
  sectionHeaderClass:
    "text-sm font-display font-bold uppercase tracking-[0.18em] text-emerald-900",
  sheetCardClass:
    "bg-[hsl(80,10%,96%)] border-emerald-300/30",
  sectionBlockClass:
    "rounded-xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50/30 to-transparent p-5",
  labelClass: "text-[11px] font-semibold uppercase tracking-wider text-emerald-900/50",
  dotFilledClass: "bg-emerald-700 border-emerald-800",
  dotEmptyClass: "bg-emerald-100/50 border-emerald-300/50",
  accentBorderClass: "border-emerald-400/30",
  hasTexture: true,
};

/** Tormenta20 — Brazilian RPG — warm crimson + obsidian */
const tormenta20Theme: SheetTheme = {
  id: "tormenta20",
  systemLabel: "Tormenta20",
  cssVars: {
    "--sheet-accent": "350 65% 45%",
    "--sheet-bg": "0 0% 97%",
    "--sheet-section-bg": "350 20% 95%",
    "--sheet-border": "350 25% 82%",
  },
  sectionHeaderClass:
    "text-sm font-display font-bold uppercase tracking-[0.18em] text-rose-800",
  sheetCardClass:
    "bg-[hsl(0,0%,97%)] border-rose-300/30",
  sectionBlockClass:
    "rounded-xl border border-rose-200/40 bg-gradient-to-br from-rose-50/30 to-transparent p-5",
  labelClass: "text-[11px] font-semibold uppercase tracking-wider text-rose-900/50",
  dotFilledClass: "bg-rose-700 border-rose-800",
  dotEmptyClass: "bg-rose-100/50 border-rose-300/50",
  accentBorderClass: "border-rose-400/30",
  hasTexture: false,
};

/** Default premium generic — plum (HIVIUM brand) */
const genericPremiumTheme: SheetTheme = {
  id: "generic",
  systemLabel: "Ficha de Personagem",
  cssVars: {
    "--sheet-accent": "270 48% 49%",
    "--sheet-bg": "272 40% 98%",
    "--sheet-section-bg": "272 30% 96%",
    "--sheet-border": "270 20% 85%",
  },
  sectionHeaderClass:
    "text-sm font-display font-bold uppercase tracking-[0.18em] text-primary",
  sheetCardClass:
    "bg-card border-primary/15 shadow-[0_4px_24px_hsl(270_48%_49%/0.06)]",
  sectionBlockClass:
    "rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-5",
  labelClass: "text-[11px] font-semibold uppercase tracking-wider text-primary/50",
  dotFilledClass: "bg-primary border-primary",
  dotEmptyClass: "bg-primary/10 border-primary/20",
  accentBorderClass: "border-primary/20",
  hasTexture: false,
};

/** Épico RPG — deep indigo & bronze, ancient tome feel */
const epicoTheme: SheetTheme = {
  id: "epico",
  systemLabel: "Épico RPG",
  cssVars: {
    "--sheet-accent": "230 50% 35%",
    "--sheet-accent-glow": "35 70% 50%",
    "--sheet-bg": "220 15% 97%",
    "--sheet-section-bg": "220 12% 95%",
    "--sheet-border": "230 20% 80%",
  },
  sectionHeaderClass:
    "text-sm font-display font-bold uppercase tracking-[0.18em] text-indigo-800",
  sheetCardClass:
    "bg-[hsl(220,15%,97%)] border-indigo-300/30 shadow-[0_4px_24px_hsl(230_40%_35%/0.06)]",
  sectionBlockClass:
    "rounded-xl border border-indigo-200/40 bg-gradient-to-br from-indigo-50/30 to-transparent p-5",
  labelClass: "text-[11px] font-semibold uppercase tracking-wider text-indigo-900/50",
  dotFilledClass: "bg-indigo-700 border-indigo-800",
  dotEmptyClass: "bg-indigo-100/50 border-indigo-300/50",
  accentBorderClass: "border-indigo-400/30",
  fontDisplay: "'Playfair Display', serif",
  hasTexture: true,
};

/** All registered themes */
const themeRegistry: Record<string, SheetTheme> = {
  exalted: exaltedTheme,
  "exalted 2e": exaltedTheme,
  "exalted 3e": exaltedTheme,
  "exalted: essence": exaltedTheme,
  "d&d 5e": dnd5eTheme,
  "dungeons & dragons 5e": dnd5eTheme,
  "dungeons & dragons 5th edition": dnd5eTheme,
  "dnd 5e": dnd5eTheme,
  "call of cthulhu 7e": coc7eTheme,
  "call of cthulhu": coc7eTheme,
  tormenta20: tormenta20Theme,
  tormenta: tormenta20Theme,
  "tormenta 20": tormenta20Theme,
  epico: epicoTheme,
  "épico": epicoTheme,
  "épico rpg": epicoTheme,
  "epico rpg": epicoTheme,
};

/**
 * Resolve the best sheet theme for a given system name.
 * Falls back to the generic premium theme.
 */
export function getSheetTheme(systemName?: string | null): SheetTheme {
  if (!systemName) return genericPremiumTheme;
  const key = systemName.toLowerCase().trim();
  return themeRegistry[key] || genericPremiumTheme;
}

export { genericPremiumTheme };
