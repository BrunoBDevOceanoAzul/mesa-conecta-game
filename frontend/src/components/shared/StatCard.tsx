import { TrendingUp } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  trend?: string;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ icon, label, value, trend, sub, accent }: StatCardProps) {
  return (
    <div
      className={`stat-widget ${
        accent
          ? "border-secondary/30 bg-secondary/5 hover:border-secondary/40"
          : "hover:border-border-strong hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1.5">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          {trend && (
            <p className="stat-delta mt-1 text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> {trend}
            </p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
