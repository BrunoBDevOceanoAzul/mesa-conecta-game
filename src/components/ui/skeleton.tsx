import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted/60 animate-shimmer",
        "bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/20 to-muted/60",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
