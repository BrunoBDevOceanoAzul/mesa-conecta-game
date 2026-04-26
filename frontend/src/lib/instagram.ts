/**
 * Central Instagram configuration with UTM-tracked links.
 * Each surface in the app gets its own utm_source / utm_content
 * so we can attribute follows by origin.
 */

const INSTAGRAM_HANDLE = "hivium";
const INSTAGRAM_BASE = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export type InstagramSource =
  | "footer"
  | "cta_section"
  | "hero"
  | "thank_you"
  | "onboarding_mapped"
  | "player_dashboard"
  | "gm_dashboard"
  | "store_dashboard"
  | "navbar_mobile"
  | "mesa_detail"
  | "mestre_profile"
  | "loja_profile"
  | "checkout_success"
  | "signup_success";

export function getInstagramUrl(source: InstagramSource): string {
  const params = new URLSearchParams({
    utm_source: "hivium_app",
    utm_medium: "social",
    utm_campaign: "instagram_follow",
    utm_content: source,
  });
  return `${INSTAGRAM_BASE}?${params.toString()}`;
}

export function getInstagramHandle(): string {
  return `@${INSTAGRAM_HANDLE}`;
}
