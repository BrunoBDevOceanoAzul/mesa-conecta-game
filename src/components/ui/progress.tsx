import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "gradient" | "gold";
}

const indicatorStyles: Record<string, string> = {
  default: "bg-primary",
  gradient: "",
  gold: "",
};

const indicatorInline: Record<string, React.CSSProperties> = {
  gradient: { backgroundImage: "var(--gradient-primary)" },
  gold: { backgroundImage: "var(--gradient-gold)" },
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-muted",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 rounded-full transition-all duration-500 ease-out",
        indicatorStyles[variant]
      )}
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        ...indicatorInline[variant],
      }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
