import { SheetDotRating } from "./SheetDotRating";
import { cn } from "@/lib/utils";

interface Attribute {
  id: string;
  label: string;
  max?: number;
}

interface SheetAttributeGridProps {
  /** Column groups — e.g. Physical / Social / Mental */
  groups: {
    title: string;
    attributes: Attribute[];
  }[];
  values: Record<string, number>;
  onChange: (id: string, value: number) => void;
  disabled?: boolean;
  filledClass?: string;
  emptyClass?: string;
  labelClass?: string;
  dotMax?: number;
}

/**
 * Attribute grid — the classic 3-column RPG attribute layout.
 * Renders groups side by side on desktop, stacked on mobile.
 */
export function SheetAttributeGrid({
  groups,
  values,
  onChange,
  disabled,
  filledClass,
  emptyClass,
  labelClass,
  dotMax = 5,
}: SheetAttributeGridProps) {
  return (
    <div className={cn("grid gap-6", groups.length === 3 ? "md:grid-cols-3" : groups.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1")}>
      {groups.map((group) => (
        <div key={group.title}>
          <h4 className={cn("text-center mb-4", labelClass || "text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60")}>
            {group.title}
          </h4>
          <div className="space-y-2.5">
            {group.attributes.map((attr) => (
              <div key={attr.id} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground min-w-0 truncate">
                  {attr.label}
                </span>
                <SheetDotRating
                  value={values[attr.id] || 0}
                  max={attr.max || dotMax}
                  onChange={(v) => onChange(attr.id, v)}
                  disabled={disabled}
                  filledClass={filledClass}
                  emptyClass={emptyClass}
                  size="md"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
