import { Entity } from "../../../shared/domain/entity.js";

export interface AuthUserProps {
  id: string;
  email: string;
  role: string;
}

export class AuthUser extends Entity<AuthUserProps> {
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get role(): string {
    return this.props.role;
  }

  static create(props: AuthUserProps): AuthUser {
    return new AuthUser(props);
  }
}
