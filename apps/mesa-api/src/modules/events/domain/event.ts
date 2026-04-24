export interface EventProps {
  id: string;
  eventType: string;
  userId: string | null;
  mesaId: string | null;
  gmId: string | null;
  payload: Record<string, unknown>;
  ipHash: string | null;
  userAgent: string | null;
  source: string | null;
  sessionId: string | null;
  createdAt: Date;
}

export class Event {
  constructor(private props: EventProps) {}

  get id(): string {
    return this.props.id;
  }

  get eventType(): string {
    return this.props.eventType;
  }

  get userId(): string | null {
    return this.props.userId;
  }

  toJSON(): EventProps {
    return { ...this.props };
  }
}
