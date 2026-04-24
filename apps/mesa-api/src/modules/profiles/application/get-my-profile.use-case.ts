import { UseCase } from "../../../shared/domain/use-case.js";
import { Profile } from "../domain/profile.js";
import { ProfileRepository } from "../domain/profile-repository.js";

export interface GetMyProfileInput {
  userId: string;
}

export class GetMyProfileUseCase implements UseCase<GetMyProfileInput, Profile | null> {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: GetMyProfileInput): Promise<Profile | null> {
    return this.profileRepository.findByUserId({ userId: input.userId });
  }
}
