import { UseCase } from "../../../shared/domain/use-case.js";
import { Profile } from "../domain/profile.js";
import { ProfileRepository } from "../domain/profile-repository.js";
import { ProfilePrivateError } from "./get-public-profile.use-case.js";

export interface GetProfileBySlugInput {
  slug: string;
  viewerUserId?: string;
}

export class GetProfileBySlugUseCase implements UseCase<GetProfileBySlugInput, Profile | null> {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: GetProfileBySlugInput): Promise<Profile | null> {
    const profile = await this.profileRepository.findBySlug({ slug: input.slug });

    if (!profile) {
      return null;
    }

    if (!profile.canBeViewedBy(input.viewerUserId)) {
      throw new ProfilePrivateError();
    }

    return profile;
  }
}
