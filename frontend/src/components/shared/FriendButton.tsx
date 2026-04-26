import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, UserMinus } from "lucide-react";
import { useFriendships } from "@/hooks/use-friendships";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface FriendButtonProps {
  targetUserId: string;
  size?: "sm" | "default";
}

export function FriendButton({ targetUserId, size = "sm" }: FriendButtonProps) {
  const { user } = useAuth();
  const { getFriendshipStatus, getFriendshipId, sendRequest, acceptRequest, removeFriend } = useFriendships();
  const [busy, setBusy] = useState(false);

  if (!user || user.id === targetUserId) return null;

  const status = getFriendshipStatus(targetUserId);
  const friendshipId = getFriendshipId(targetUserId);

  const handle = async () => {
    setBusy(true);
    try {
      if (status === "none") {
        await sendRequest(targetUserId);
      } else if (status === "pending_received" && friendshipId) {
        await acceptRequest(friendshipId);
      } else if ((status === "accepted" || status === "pending_sent") && friendshipId) {
        await removeFriend(friendshipId);
      }
    } finally {
      setBusy(false);
    }
  };

  const config = {
    none: { icon: UserPlus, label: "Adicionar amigo", variant: "default" as const },
    pending_sent: { icon: Clock, label: "Solicitado", variant: "secondary" as const },
    pending_received: { icon: UserPlus, label: "Aceitar", variant: "default" as const },
    accepted: { icon: UserCheck, label: "Amigos", variant: "outline" as const },
  }[status];

  const Icon = config.icon;

  return (
    <Button
      variant={config.variant}
      size={size}
      onClick={handle}
      disabled={busy}
      className="gap-1.5"
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Button>
  );
}
