/**
 * Exalted 2E — Character sheet template definition.
 *
 * This defines the STRUCTURE (sections, fields, attribute groups)
 * for the Exalted character sheet. The VISUAL theme is in sheet-themes.ts.
 */

import type { SheetTemplate } from "./sheet-template-types";

export const exaltedTemplate: SheetTemplate = {
  id: "exalted-2e",
  systemName: "Exalted 2E",
  themeId: "exalted",
  sections: [
    /* ── IDENTITY ── */
    {
      id: "identity",
      title: "Identidade",
      subtitle: "Quem é seu Exaltado",
      layout: "info-grid",
      fields: [
        { id: "name", label: "Nome", type: "text", required: true, colSpan: 2 },
        { id: "player", label: "Jogador", type: "text" },
        { id: "concept", label: "Conceito", type: "text" },
        { id: "caste", label: "Casta / Aspecto", type: "text", required: true },
        { id: "exalt_type", label: "Tipo de Exaltado", type: "select", options: [
          "Solar", "Lunar", "Sidereal", "Dragon-Blooded", "Abyssal", "Infernal", "Alchemical", "Outro",
        ]},
        { id: "motivation", label: "Motivação", type: "text", colSpan: 2 },
        { id: "anima_banner", label: "Anima Banner", type: "text" },
      ],
    },

    /* ── ATTRIBUTES ── */
    {
      id: "attributes",
      title: "Atributos",
      subtitle: "Corpo, mente e presença",
      layout: "attribute-grid",
      attributeGroups: [
        {
          title: "Físicos",
          attributes: [
            { id: "attr_strength", label: "Força" },
            { id: "attr_dexterity", label: "Destreza" },
            { id: "attr_stamina", label: "Vigor" },
          ],
        },
        {
          title: "Sociais",
          attributes: [
            { id: "attr_charisma", label: "Carisma" },
            { id: "attr_manipulation", label: "Manipulação" },
            { id: "attr_appearance", label: "Aparência" },
          ],
        },
        {
          title: "Mentais",
          attributes: [
            { id: "attr_perception", label: "Percepção" },
            { id: "attr_intelligence", label: "Inteligência" },
            { id: "attr_wits", label: "Raciocínio" },
          ],
        },
      ],
      dotMax: 5,
    },

    /* ── ABILITIES ── */
    {
      id: "abilities",
      title: "Habilidades",
      subtitle: "Treino e competências",
      layout: "ability-grid",
      abilityGroups: [
        {
          title: "Dote",
          abilities: [
            { id: "archery", label: "Arco & Flecha" },
            { id: "martial_arts", label: "Artes Marciais" },
            { id: "melee", label: "Armas Brancas" },
            { id: "thrown", label: "Arremesso" },
            { id: "war", label: "Guerra" },
          ],
        },
        {
          title: "Vida",
          abilities: [
            { id: "integrity", label: "Integridade" },
            { id: "performance", label: "Performance" },
            { id: "presence", label: "Presença" },
            { id: "resistance", label: "Resistência" },
            { id: "survival", label: "Sobrevivência" },
          ],
        },
        {
          title: "Saga",
          abilities: [
            { id: "craft", label: "Artesanato" },
            { id: "investigation", label: "Investigação" },
            { id: "lore", label: "Saber" },
            { id: "medicine", label: "Medicina" },
            { id: "occult", label: "Ocultismo" },
          ],
        },
        {
          title: "Astúcia",
          abilities: [
            { id: "athletics", label: "Atletismo" },
            { id: "awareness", label: "Percepção" },
            { id: "dodge", label: "Esquiva" },
            { id: "larceny", label: "Lábia" },
            { id: "stealth", label: "Furtividade" },
          ],
        },
        {
          title: "Domínio",
          abilities: [
            { id: "bureaucracy", label: "Burocracia" },
            { id: "linguistics", label: "Linguística" },
            { id: "ride", label: "Montaria" },
            { id: "sail", label: "Navegação" },
            { id: "socialize", label: "Socialização" },
          ],
        },
      ],
      dotMax: 5,
    },

    /* ── SPECIALTIES ── */
    {
      id: "specialties",
      title: "Especializações",
      layout: "list",
      fields: [
        { id: "specialties_list", label: "Especializações", type: "textarea", placeholder: "Melee (Espadas), Performance (Canto)..." },
      ],
    },

    /* ── MERITS ── */
    {
      id: "merits",
      title: "Méritos",
      subtitle: "Vantagens e recursos",
      layout: "dot-list",
      listFields: [
        { id: "merit_1", label: "", type: "text-dot", dotMax: 5 },
        { id: "merit_2", label: "", type: "text-dot", dotMax: 5 },
        { id: "merit_3", label: "", type: "text-dot", dotMax: 5 },
        { id: "merit_4", label: "", type: "text-dot", dotMax: 5 },
        { id: "merit_5", label: "", type: "text-dot", dotMax: 5 },
        { id: "merit_6", label: "", type: "text-dot", dotMax: 5 },
      ],
    },

    /* ── VIRTUES ── */
    {
      id: "virtues",
      title: "Virtudes",
      layout: "attribute-grid",
      attributeGroups: [
        {
          title: "",
          attributes: [
            { id: "virtue_compassion", label: "Compaixão" },
            { id: "virtue_conviction", label: "Convicção" },
            { id: "virtue_temperance", label: "Temperança" },
            { id: "virtue_valor", label: "Valor" },
          ],
        },
      ],
      dotMax: 5,
    },

    /* ── ESSENCE & WILLPOWER ── */
    {
      id: "essence_willpower",
      title: "Essência & Força de Vontade",
      layout: "stats-row",
      fields: [
        { id: "essence_rating", label: "Essência", type: "dots", dotMax: 10, required: true },
        { id: "willpower_permanent", label: "Força de Vontade (Permanente)", type: "dots", dotMax: 10 },
        { id: "willpower_temporary", label: "Força de Vontade (Temporária)", type: "dots", dotMax: 10 },
      ],
    },

    /* ── HEALTH ── */
    {
      id: "health",
      title: "Níveis de Saúde",
      layout: "health-track",
      fields: [
        { id: "health_0", label: "-0", type: "number", min: 0, max: 5 },
        { id: "health_1", label: "-1", type: "number", min: 0, max: 5 },
        { id: "health_2", label: "-2", type: "number", min: 0, max: 5 },
        { id: "health_4", label: "-4", type: "number", min: 0, max: 5 },
        { id: "health_incap", label: "Incapacitado", type: "number", min: 0, max: 1 },
      ],
    },

    /* ── COMBAT ── */
    {
      id: "combat",
      title: "Combate",
      subtitle: "Armas e defesas",
      layout: "info-grid",
      fields: [
        { id: "join_battle", label: "Iniciativa (Join Battle)", type: "text" },
        { id: "dodge_dv", label: "Dodge DV", type: "text" },
        { id: "parry_dv", label: "Parry DV", type: "text" },
        { id: "soak_bashing", label: "Soak (Contusão)", type: "text" },
        { id: "soak_lethal", label: "Soak (Letal)", type: "text" },
        { id: "soak_aggravated", label: "Soak (Agravado)", type: "text" },
      ],
    },

    /* ── WEAPONS ── */
    {
      id: "weapons",
      title: "Armas",
      layout: "list",
      fields: [
        { id: "weapons_list", label: "Armas & Equipamento", type: "textarea", placeholder: "Daiklave Grand (Speed 5, Acc +3, Dmg +12L)..." },
      ],
    },

    /* ── CHARMS ── */
    {
      id: "charms",
      title: "Charms",
      subtitle: "Poderes sobrenaturais",
      layout: "list",
      fields: [
        { id: "charms_list", label: "Charms & Combos", type: "textarea", placeholder: "Sensory Acuity Prana, Graceful Crane Stance..." },
      ],
    },

    /* ── INTIMACIES ── */
    {
      id: "intimacies",
      title: "Intimidades",
      layout: "list",
      fields: [
        { id: "intimacies_list", label: "Intimidades", type: "textarea", placeholder: "Proteger os inocentes, Ódio pela Realm..." },
      ],
    },

    /* ── BACKGROUND STORY ── */
    {
      id: "background",
      title: "História & Notas",
      subtitle: "A jornada até aqui",
      layout: "list",
      fields: [
        { id: "background_story", label: "Background", type: "textarea" },
        { id: "notes", label: "Notas do Jogador", type: "textarea" },
      ],
    },

    /* ── EXPERIENCE ── */
    {
      id: "experience",
      title: "Experiência",
      layout: "info-grid",
      fields: [
        { id: "xp_total", label: "XP Total", type: "number", min: 0 },
        { id: "xp_spent", label: "XP Gasto", type: "number", min: 0 },
        { id: "xp_remaining", label: "XP Restante", type: "number", min: 0 },
      ],
    },
  ],
};
