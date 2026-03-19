import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-secondary/10 text-secondary",
        destructive:
          "border-transparent bg-destructive/10 text-destructive",
        outline:
          "border-border text-foreground",
        success:
          "border-transparent bg-success/10 text-success",
        warning:
          "border-transparent bg-warning/10 text-warning",
        info:
          "border-transparent bg-info/10 text-info",
        premium:
          "border-transparent border border-white/8 text-primary-foreground font-bold",
        gold:
          "border-transparent text-secondary-foreground font-bold",
        founder:
          "border-transparent border border-white/8 text-primary-foreground font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const badgeGradientStyles: Record<string, React.CSSProperties> = {
  premium: {
    backgroundImage: "var(--gradient-premium)",
  },
  gold: {
    backgroundImage: "var(--gradient-gold)",
  },
  founder: {
    backgroundImage: "var(--gradient-founder)",
  },
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const gradientStyle =
    variant && badgeGradientStyles[variant]
      ? { ...badgeGradientStyles[variant], ...style }
      : style;

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={gradientStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
