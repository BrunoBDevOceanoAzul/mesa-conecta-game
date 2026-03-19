import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, action, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state rounded-xl border border-dashed border-border bg-card/50">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-description">{description}</p>}
      {action && onAction && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}
