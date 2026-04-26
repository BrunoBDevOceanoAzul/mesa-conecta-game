import { AuthRepository } from "../domain/auth-repository.js";
import { AuthUser } from "../domain/auth-user.js";

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly supabaseUrl: string,
    private readonly supabaseKey: string
  ) {}

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: this.supabaseKey,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.id || !data.email) {
        return null;
      }

      return AuthUser.create({
        id: data.id,
        email: data.email,
        role: data.role || "user",
      });
    } catch {
      return null;
    }
  }
}
