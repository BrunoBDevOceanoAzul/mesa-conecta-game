import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SheetSectionBlockProps {
  title: string;
  children: ReactNode;
  /** Tailwind classes from the theme */
  blockClass?: string;
  headerClass?: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Optional icon */
  icon?: ReactNode;
}

/**
 * A themed section block that visually separates sheet areas.
 * Feels like a block on a physical character sheet.
 */
export function SheetSectionBlock({
  title,
  children,
  blockClass,
  headerClass,
  subtitle,
  icon,
}: SheetSectionBlockProps) {
  return (
    <div className={cn("space-y-4", blockClass)}>
      {/* Section header with ornamental line */}
      <div className="flex items-center gap-3">
        {icon && <div className="shrink-0 text-muted-foreground/40">{icon}</div>}
        <div className="flex-1">
          <h3 className={cn(headerClass)}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">{subtitle}</p>
          )}
        </div>
        {/* Ornamental line */}
        <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
      </div>
      {children}
    </div>
  );
}
