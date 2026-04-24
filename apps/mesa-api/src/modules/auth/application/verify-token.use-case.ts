import { UseCase } from "../../../shared/domain/use-case.js";
import { AuthUser } from "../domain/auth-user.js";
import { AuthRepository } from "../domain/auth-repository.js";

export class VerifyTokenUseCase implements UseCase<string, AuthUser | null> {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(token: string): Promise<AuthUser | null> {
    if (!token || token.trim().length === 0) {
      return null;
    }
    return this.authRepository.verifyToken(token);
  }
}
