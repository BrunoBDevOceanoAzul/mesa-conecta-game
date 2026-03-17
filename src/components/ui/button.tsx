import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium font-body transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-hover hover:border-border-strong",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85",
        ghost:
          "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]",
        "hero-outline":
          "border border-border text-foreground hover:bg-surface-hover hover:border-primary/40 hover:shadow-md hover:shadow-primary/8",
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90",
        gradient:
          "text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-white/[0.08]",
        "gradient-subtle":
          "text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] border border-white/[0.06]",
        "gradient-premium":
          "text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-white/[0.1]",
        "gradient-founder":
          "text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-white/[0.1] font-bold",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-sm px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const gradientStyles: Record<string, React.CSSProperties> = {
  gradient: {
    backgroundImage:
      "linear-gradient(135deg, hsl(272 48% 42%) 0%, hsl(280 44% 52%) 40%, hsl(310 36% 48%) 70%, hsl(38 62% 56%) 100%)",
    backgroundSize: "200% 200%",
    backgroundPosition: "0% 50%",
  },
  "gradient-subtle": {
    backgroundImage:
      "linear-gradient(135deg, hsl(272 42% 38%) 0%, hsl(285 38% 46%) 50%, hsl(42 50% 50%) 100%)",
    backgroundSize: "200% 200%",
    backgroundPosition: "0% 50%",
  },
  "gradient-premium": {
    backgroundImage:
      "linear-gradient(135deg, hsl(265 50% 36%) 0%, hsl(280 48% 48%) 35%, hsl(320 32% 44%) 65%, hsl(40 70% 58%) 100%)",
    backgroundSize: "200% 200%",
    backgroundPosition: "0% 50%",
  },
  "gradient-founder": {
    backgroundImage:
      "linear-gradient(135deg, hsl(42 72% 48%) 0%, hsl(32 78% 50%) 40%, hsl(280 42% 48%) 80%, hsl(265 48% 42%) 100%)",
    backgroundSize: "200% 200%",
    backgroundPosition: "0% 50%",
  },
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const gradientStyle =
      variant && gradientStyles[variant]
        ? { ...gradientStyles[variant], ...style }
        : style;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={gradientStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
