/**
 * Sheet Template Registry — maps system names to templates.
 */

import type { SheetTemplate } from "./sheet-template-types";
import { exaltedTemplate } from "./exalted-2e";
import { epicoTemplate } from "./epico-rpg";

const templateRegistry: Record<string, SheetTemplate> = {
  "exalted 2e": exaltedTemplate,
  exalted: exaltedTemplate,
  "exalted: essence": exaltedTemplate,
  "exalted 3e": exaltedTemplate,
  "épico rpg": epicoTemplate,
  "epico rpg": epicoTemplate,
  "épico": epicoTemplate,
  epico: epicoTemplate,
};

/**
 * Resolve the best template for a system name.
 * Returns null if no specific template exists.
 */
export function getSheetTemplate(systemName?: string | null): SheetTemplate | null {
  if (!systemName) return null;
  const key = systemName.toLowerCase().trim();
  return templateRegistry[key] || null;
}

export type { SheetTemplate, SheetSectionDef, SheetFieldDef } from "./sheet-template-types";
