import { UseCase } from "../../../shared/domain/use-case.js";
import { Profile } from "../domain/profile.js";
import { ProfileRepository } from "../domain/profile-repository.js";

export interface GetPublicProfileInput {
  id: string;
  viewerUserId?: string;
}

export class GetPublicProfileUseCase implements UseCase<GetPublicProfileInput, Profile | null> {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: GetPublicProfileInput): Promise<Profile | null> {
    const profile = await this.profileRepository.findById({ id: input.id });

    if (!profile) {
      return null;
    }

    if (!profile.canBeViewedBy(input.viewerUserId)) {
      throw new ProfilePrivateError();
    }

    return profile;
  }
}

export class ProfilePrivateError extends Error {
  constructor() {
    super("Profile is private");
    this.name = "ProfilePrivateError";
  }
}
