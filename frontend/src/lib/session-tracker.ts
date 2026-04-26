import { supabase } from "@/integrations/supabase/client";

function parseUserAgent() {
  const ua = navigator.userAgent;

  // Device type
  let device_type = "desktop";
  if (/Mobi|Android/i.test(ua)) device_type = "mobile";
  else if (/Tablet|iPad/i.test(ua)) device_type = "tablet";

  // Browser
  let browser = "unknown";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR/")) browser = "Opera";

  // OS
  let os = "unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";

  return { device_type, browser, os, user_agent: ua };
}

export async function trackSignIn(userId: string, provider: string = "email") {
  try {
    const { device_type, browser, os, user_agent } = parseUserAgent();

    await supabase.from("user_sessions").insert({
      user_id: userId,
      auth_provider: provider,
      device_type,
      browser,
      os,
      user_agent,
    });
  } catch (e) {
    console.warn("Session tracking failed:", e);
  }
}

export async function trackSignOut(userId: string) {
  try {
    // Mark all active sessions for user as signed out
    await supabase
      .from("user_sessions")
      .update({
        is_active: false,
        signed_out_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_active", true);
  } catch (e) {
    console.warn("Session sign-out tracking failed:", e);
  }
}

export async function updateLastSeen(userId: string) {
  try {
    await supabase
      .from("user_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("signed_in_at", { ascending: false })
      .limit(1);
  } catch (e) {
    // silent
  }
}
