import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileText, Link2, StickyNote, CheckSquare, Plus, Trash2, GripVertical,
} from "lucide-react";
import type { MaterialItem } from "@/hooks/use-preparation-flow";

interface MaterialsEditorProps {
  materials: MaterialItem[];
  onChange: (materials: MaterialItem[]) => void;
  readOnly?: boolean;
}

const TYPE_CONFIG = {
  note: { icon: StickyNote, label: "Nota", color: "text-primary" },
  link: { icon: Link2, label: "Link", color: "text-blue-500" },
  file: { icon: FileText, label: "Arquivo", color: "text-teal-500" },
  checklist: { icon: CheckSquare, label: "Checklist", color: "text-secondary" },
} as const;

export function MaterialsEditor({ materials, onChange, readOnly }: MaterialsEditorProps) {
  const addMaterial = (type: MaterialItem["type"]) => {
    onChange([...materials, { type, title: "", content: "" }]);
  };

  const updateMaterial = (idx: number, patch: Partial<MaterialItem>) => {
    const next = [...materials];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeMaterial = (idx: number) => {
    onChange(materials.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-secondary" />
          <h3 className="text-sm font-display font-semibold text-foreground">
            Materiais da Mesa
          </h3>
        </div>
        {!readOnly && (
          <div className="flex gap-1">
            {(Object.keys(TYPE_CONFIG) as MaterialItem["type"][]).map((type) => {
              const cfg = TYPE_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => addMaterial(type)}
                  className="text-[10px] gap-1 h-7 px-2"
                >
                  <Icon className={`h-3 w-3 ${cfg.color}`} />
                  {cfg.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {materials.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Adicione materiais para seus jogadores: instruções, links, house rules...
          </p>
        </div>
      )}

      {materials.map((item, idx) => {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
        const Icon = cfg.icon;

        return (
          <div
            key={idx}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              {!readOnly && <GripVertical className="h-4 w-4 text-muted-foreground/40" />}
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              {readOnly ? (
                <span className="text-sm font-medium text-foreground flex-1">{item.title}</span>
              ) : (
                <Input
                  value={item.title}
                  onChange={(e) => updateMaterial(idx, { title: e.target.value })}
                  placeholder={`Título do ${cfg.label.toLowerCase()}`}
                  className="h-8 text-sm flex-1"
                />
              )}
              {!readOnly && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => removeMaterial(idx)}
                  className="text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {(item.type === "note" || item.type === "checklist") && (
              readOnly ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-8">
                  {item.content}
                </p>
              ) : (
                <Textarea
                  value={item.content || ""}
                  onChange={(e) => updateMaterial(idx, { content: e.target.value })}
                  placeholder={item.type === "checklist"
                    ? "Um item por linha"
                    : "Conteúdo da nota..."
                  }
                  className="min-h-[60px] text-sm ml-8"
                />
              )
            )}

            {item.type === "link" && (
              readOnly ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline pl-8 block"
                >
                  {item.url}
                </a>
              ) : (
                <Input
                  value={item.url || ""}
                  onChange={(e) => updateMaterial(idx, { url: e.target.value })}
                  placeholder="https://..."
                  className="h-8 text-sm ml-8"
                />
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
