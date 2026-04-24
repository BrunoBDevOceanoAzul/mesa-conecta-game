import { UseCase } from "../../../shared/domain/use-case.js";
import { Profile } from "../domain/profile.js";
import { ProfileRepository, UpdateProfileInput } from "../domain/profile-repository.js";

export class UpdateProfileUseCase implements UseCase<UpdateProfileInput, Profile | null> {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: UpdateProfileInput): Promise<Profile | null> {
    return this.profileRepository.update(input);
  }
}
