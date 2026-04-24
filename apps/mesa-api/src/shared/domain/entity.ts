export abstract class Entity<T> {
  protected constructor(protected props: T) {}

  toJSON(): T {
    return { ...this.props };
  }

  equals(other: Entity<T>): boolean {
    return this.props === other.props;
  }
}
