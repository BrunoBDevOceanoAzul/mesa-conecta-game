/**
 * Épico RPG — Sheet Template
 * Original HIVIUM digital sheet for the Épico RPG system.
 */
import type { SheetTemplate } from "./sheet-template-types";

export const epicoTemplate: SheetTemplate = {
  id: "epico-rpg",
  systemName: "Épico RPG",
  themeId: "epico",
  sections: [
    {
      id: "header",
      title: "Cabeçalho",
      layout: "info-grid",
      fields: [
        { id: "character_name", label: "Personagem", type: "text", required: true, colSpan: 2 },
        { id: "player_name", label: "Jogador", type: "text", required: true },
        { id: "xp_total", label: "XP Total", type: "number", placeholder: "0" },
      ],
    },
    {
      id: "attributes",
      title: "Atributos",
      subtitle: "Atributos principais do personagem",
      layout: "attribute-grid",
      attributeGroups: [
        {
          title: "Atributos Primários",
          attributes: [
            { id: "vigor", label: "Vigor", max: 10 },
            { id: "agilidade", label: "Agilidade", max: 10 },
            { id: "inteligencia", label: "Inteligência", max: 10 },
          ],
        },
      ],
    },
    {
      id: "fadiga",
      title: "Fadiga",
      subtitle: "Fadiga por atributo",
      layout: "stats-row",
      fields: [
        { id: "fadiga_vigor", label: "Fadiga (Vigor)", type: "number", min: 0 },
        { id: "fadiga_agilidade", label: "Fadiga (Agilidade)", type: "number", min: 0 },
        { id: "fadiga_inteligencia", label: "Fadiga (Inteligência)", type: "number", min: 0 },
      ],
    },
    {
      id: "secondary",
      title: "Atributos Secundários",
      subtitle: "Derivados dos atributos primários",
      layout: "stats-row",
      fields: [
        { id: "dificuldade_alvo", label: "Dificuldade-Alvo", type: "number" },
        { id: "forca_vontade", label: "Força de Vontade", type: "number" },
        { id: "bonus_dano", label: "Bônus de Dano", type: "number" },
        { id: "percepcao", label: "Percepção", type: "number" },
        { id: "velocidade", label: "Velocidade", type: "number" },
        { id: "tamanho", label: "Tamanho", type: "number" },
        { id: "pontos_vida", label: "Pontos de Vida", type: "number" },
        { id: "ferimentos", label: "Ferimentos", type: "number", min: 0 },
        { id: "carga_pesada", label: "Carga Pesada", type: "number" },
        { id: "carga_maxima", label: "Carga Máxima", type: "number" },
      ],
    },
    {
      id: "virtudes",
      title: "Virtudes",
      layout: "list",
      listFields: [{ id: "virtude", label: "Virtude", type: "text-dot", dotMax: 5 }],
    },
    {
      id: "defeitos",
      title: "Defeitos",
      layout: "list",
      listFields: [{ id: "defeito", label: "Defeito", type: "text-dot", dotMax: 5 }],
    },
    {
      id: "aptidoes",
      title: "Aptidões & Especialidades",
      layout: "list",
      listFields: [{ id: "aptidao", label: "Aptidão / Especialidade", type: "text-dot", dotMax: 5 }],
    },
    {
      id: "ataques",
      title: "Ataques",
      layout: "list",
      listFields: [{ id: "ataque", label: "Ataque", type: "text-dot", dotMax: 5 }],
    },
    {
      id: "armaduras",
      title: "Armaduras",
      layout: "list",
      listFields: [{ id: "armadura", label: "Armadura", type: "text-dot", dotMax: 5 }],
    },
    {
      id: "dinheiro",
      title: "Dinheiro & Tesouros",
      layout: "list",
      listFields: [{ id: "tesouro", label: "Item / Valor", type: "text-dot", dotMax: 0 }],
    },
    {
      id: "equipamentos",
      title: "Itens & Equipamentos",
      layout: "list",
      listFields: [{ id: "item", label: "Item", type: "text-dot", dotMax: 0 }],
    },
    {
      id: "anotacoes",
      title: "Anotações",
      layout: "info-grid",
      fields: [
        { id: "anotacoes", label: "Anotações do Personagem", type: "textarea", colSpan: 2 },
      ],
    },
  ],
};
