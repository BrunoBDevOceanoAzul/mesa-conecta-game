import { describe, it, expect, vi } from "../../../test/node-test-compat.js";
import { VerifyTokenUseCase } from "./verify-token.use-case.js";
import { AuthUser } from "../domain/auth-user.js";

describe("VerifyTokenUseCase", () => {
  it("returns null when token is empty", async () => {
    const repo = { verifyToken: vi.fn() };
    const useCase = new VerifyTokenUseCase(repo);

    const result = await useCase.execute("");

    expect(result).toBeNull();
    expect(repo.verifyToken).not.toHaveBeenCalled();
  });

  it("returns null when token is whitespace only", async () => {
    const repo = { verifyToken: vi.fn() };
    const useCase = new VerifyTokenUseCase(repo);

    const result = await useCase.execute("   ");

    expect(result).toBeNull();
    expect(repo.verifyToken).not.toHaveBeenCalled();
  });

  it("returns user when token is valid", async () => {
    const user = AuthUser.create({
      id: "1",
      email: "test@example.com",
      role: "user",
    });
    const repo = { verifyToken: vi.fn().mockResolvedValue(user) };
    const useCase = new VerifyTokenUseCase(repo);

    const result = await useCase.execute("valid-token");

    expect(result).toEqual(user);
    expect(repo.verifyToken).toHaveBeenCalledWith("valid-token");
    expect(repo.verifyToken).toHaveBeenCalledTimes(1);
  });

  it("returns null when repository returns null", async () => {
    const repo = { verifyToken: vi.fn().mockResolvedValue(null) };
    const useCase = new VerifyTokenUseCase(repo);

    const result = await useCase.execute("invalid-token");

    expect(result).toBeNull();
    expect(repo.verifyToken).toHaveBeenCalledWith("invalid-token");
  });
});
