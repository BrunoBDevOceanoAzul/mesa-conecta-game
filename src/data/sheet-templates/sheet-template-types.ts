/**
 * Sheet Template type definitions.
 * This is the schema that powers system-specific character sheets.
 */

export interface SheetFieldDef {
  id: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "dots" | "text-dot";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  dotMax?: number;
  /** Grid column span (1 or 2) */
  colSpan?: number;
}

export interface SheetAttributeDef {
  id: string;
  label: string;
  max?: number;
}

export interface SheetAttributeGroup {
  title: string;
  attributes: SheetAttributeDef[];
}

export interface SheetAbilityGroup {
  title: string;
  abilities: SheetAttributeDef[];
}

export interface SheetListFieldDef {
  id: string;
  label: string;
  type: "text-dot";
  dotMax: number;
}

export interface SheetSectionDef {
  id: string;
  title: string;
  subtitle?: string;
  layout: "info-grid" | "attribute-grid" | "ability-grid" | "dot-list" | "list" | "stats-row" | "health-track";
  fields?: SheetFieldDef[];
  attributeGroups?: SheetAttributeGroup[];
  abilityGroups?: SheetAbilityGroup[];
  listFields?: SheetListFieldDef[];
  dotMax?: number;
}

export interface SheetTemplate {
  id: string;
  systemName: string;
  themeId: string;
  sections: SheetSectionDef[];
}
