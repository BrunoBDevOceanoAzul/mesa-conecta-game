import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ScrollText, ChevronDown, ChevronUp, Plus, Trash2, GripVertical,
  Sparkles, Save, Loader2, Eye,
} from "lucide-react";
import type { FormSection, FormField } from "@/hooks/use-preparation-flow";

interface CharacterSheetEditorProps {
  sections: FormSection[];
  onChange: (sections: FormSection[]) => void;
  systemName?: string;
  readOnly?: boolean;
}

export function CharacterSheetEditor({
  sections, onChange, systemName, readOnly,
}: CharacterSheetEditorProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateSection = (idx: number, patch: Partial<FormSection>) => {
    const next = [...sections];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const updateField = (sIdx: number, fIdx: number, patch: Partial<FormField>) => {
    const next = [...sections];
    const fields = [...next[sIdx].fields];
    fields[fIdx] = { ...fields[fIdx], ...patch };
    next[sIdx] = { ...next[sIdx], fields };
    onChange(next);
  };

  const addField = (sIdx: number) => {
    const next = [...sections];
    const newId = `custom_${Date.now()}`;
    next[sIdx] = {
      ...next[sIdx],
      fields: [...next[sIdx].fields, {
        id: newId, label: "Novo campo", type: "text", required: false,
      }],
    };
    onChange(next);
  };

  const removeField = (sIdx: number, fIdx: number) => {
    const next = [...sections];
    next[sIdx] = {
      ...next[sIdx],
      fields: next[sIdx].fields.filter((_, i) => i !== fIdx),
    };
    onChange(next);
  };

  const addSection = () => {
    const newId = `section_${Date.now()}`;
    onChange([...sections, {
      id: newId, title: "Nova Seção", fields: [],
    }]);
    setOpenSections((prev) => new Set([...prev, newId]));
  };

  const removeSection = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">
            Ficha de Personagem
          </h3>
          {systemName && (
            <span className="text-[10px] rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium">
              {systemName}
            </span>
          )}
        </div>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={addSection} className="text-xs gap-1">
            <Plus className="h-3 w-3" /> Seção
          </Button>
        )}
      </div>

      {sections.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
          <ScrollText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma seção na ficha. Selecione um sistema para gerar automaticamente.
          </p>
        </div>
      )}

      {sections.map((section, sIdx) => (
        <Collapsible
          key={section.id}
          open={openSections.has(section.id)}
          onOpenChange={() => toggle(section.id)}
        >
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  {!readOnly && <GripVertical className="h-4 w-4 text-muted-foreground/40" />}
                  <span className="text-sm font-semibold text-foreground">{section.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {section.fields.length} campo{section.fields.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {openSections.has(section.id) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                      className="text-sm font-medium h-8"
                      placeholder="Nome da seção"
                    />
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => removeSection(sIdx)}
                      className="text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {section.fields.map((field, fIdx) => (
                  <div
                    key={field.id}
                    className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-2"
                  >
                    {readOnly ? (
                      <Label className="text-xs font-medium">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(sIdx, fIdx, { label: e.target.value })}
                          className="text-xs h-7 flex-1"
                          placeholder="Nome do campo"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(sIdx, fIdx, { type: e.target.value as FormField["type"] })}
                          className="text-[10px] rounded border border-border bg-background px-2 py-1 h-7"
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="textarea">Texto Longo</option>
                          <option value="select">Seleção</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={!!field.required}
                            onCheckedChange={(v) => updateField(sIdx, fIdx, { required: v })}
                            className="scale-75"
                          />
                          <span className="text-[10px] text-muted-foreground">Obrig.</span>
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => removeField(sIdx, fIdx)}
                          className="text-destructive h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {!readOnly && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => addField(sIdx)}
                    className="text-xs gap-1 text-primary"
                  >
                    <Plus className="h-3 w-3" /> Adicionar campo
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}
