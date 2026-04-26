export interface RecommendationProps {
  mesaId: string;
  score: number;
  scores: {
    proximity: number;
    preferenceMatch: number;
    gmQuality: number;
    popularity: number;
    freshness: number;
    boost: number;
  };
  mesaData: Record<string, unknown>;
}

export class Recommendation {
  constructor(private props: RecommendationProps) {}

  get mesaId(): string {
    return this.props.mesaId;
  }

  get score(): number {
    return this.props.score;
  }

  get scores(): RecommendationProps["scores"] {
    return this.props.scores;
  }

  get mesaData(): Record<string, unknown> {
    return this.props.mesaData;
  }

  toJSON(): RecommendationProps {
    return { ...this.props };
  }
}
