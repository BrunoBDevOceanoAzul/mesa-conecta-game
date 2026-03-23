import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  /** Joined profile info of the other user */
  profile?: {
    user_id: string;
    name: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string | null;
  };
}

export function useFriendships() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await (supabase as any)
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .in("status", ["pending", "accepted"]);

    if (!data) {
      setLoading(false);
      return;
    }

    // Gather other user IDs
    const otherIds = (data as any[]).map((f: any) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    let profileMap: Record<string, any> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, display_name, avatar_url, bio, role")
        .in("user_id", otherIds);
      if (profiles) {
        profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p]));
      }
    }

    const enriched = (data as any[]).map((f: any) => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      return { ...f, profile: profileMap[otherId] || null } as Friendship;
    });

    setFriends(enriched.filter((f) => f.status === "accepted"));
    setPendingReceived(enriched.filter((f) => f.status === "pending" && f.addressee_id === user.id));
    setPendingSent(enriched.filter((f) => f.status === "pending" && f.requester_id === user.id));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;
    await (supabase as any).from("friendships").insert({
      requester_id: user.id,
      addressee_id: addresseeId,
    });
    await load();
  };

  const acceptRequest = async (friendshipId: string) => {
    await (supabase as any)
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    await load();
  };

  const rejectRequest = async (friendshipId: string) => {
    await (supabase as any)
      .from("friendships")
      .update({ status: "rejected" })
      .eq("id", friendshipId);
    await load();
  };

  const removeFriend = async (friendshipId: string) => {
    await (supabase as any)
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    await load();
  };

  const getFriendshipStatus = (otherUserId: string): "none" | "pending_sent" | "pending_received" | "accepted" => {
    if (friends.some((f) => f.profile?.user_id === otherUserId)) return "accepted";
    if (pendingSent.some((f) => f.addressee_id === otherUserId)) return "pending_sent";
    if (pendingReceived.some((f) => f.requester_id === otherUserId)) return "pending_received";
    return "none";
  };

  const getFriendshipId = (otherUserId: string): string | null => {
    const all = [...friends, ...pendingSent, ...pendingReceived];
    const f = all.find((f) => f.profile?.user_id === otherUserId);
    return f?.id || null;
  };

  return {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    getFriendshipStatus,
    getFriendshipId,
    reload: load,
  };
}
