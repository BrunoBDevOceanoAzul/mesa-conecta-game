import { AuthUser } from "./auth-user.js";

export interface AuthRepository {
  verifyToken(token: string): Promise<AuthUser | null>;
}
