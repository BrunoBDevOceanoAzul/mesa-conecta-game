import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/12 text-primary",
        secondary:
          "border-transparent bg-secondary/12 text-secondary",
        destructive:
          "border-transparent bg-destructive/12 text-destructive",
        outline:
          "border-border text-foreground",
        success:
          "border-transparent bg-success/12 text-success",
        warning:
          "border-transparent bg-warning/12 text-warning",
        info:
          "border-transparent bg-info/12 text-info",
        premium:
          "border-transparent text-primary-foreground font-bold",
        gold:
          "border-transparent text-secondary-foreground font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const gradientStyle =
    variant === "premium"
      ? { backgroundImage: "linear-gradient(135deg, hsl(270 52% 48%), hsl(42 78% 50%))", ...style }
      : variant === "gold"
        ? { backgroundImage: "linear-gradient(135deg, hsl(42 78% 50%), hsl(32 82% 52%))", ...style }
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
