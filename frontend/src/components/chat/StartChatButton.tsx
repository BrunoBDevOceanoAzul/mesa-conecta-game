import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStartConversation } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StartChatButtonProps {
  targetUserId: string;
  targetName: string;
  conversationType: "gm_player" | "store_gm" | "store_player";
  relatedTableId?: string;
  relatedBookingId?: string;
  relatedStoreId?: string;
  subject?: string;
  variant?: "default" | "outline" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  className?: string;
  myRoleLabel?: string;
  otherRoleLabel?: string;
}

export function StartChatButton({
  targetUserId,
  targetName,
  conversationType,
  relatedTableId,
  relatedBookingId,
  relatedStoreId,
  subject,
  variant = "outline",
  size = "sm",
  label = "Enviar mensagem",
  className,
  myRoleLabel,
  otherRoleLabel,
}: StartChatButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startConversation } = useStartConversation();
  const [loading, setLoading] = useState(false);

  if (!user || user.id === targetUserId) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const convId = await startConversation({
        otherUserId: targetUserId,
        conversationType,
        subject,
        relatedTableId,
        relatedBookingId,
        relatedStoreId,
        myRoleLabel,
        otherRoleLabel,
      });

      if (convId) {
        navigate(`/mensagens?conv=${convId}`);
      } else {
        toast.error("Não foi possível iniciar a conversa.");
      }
    } catch {
      toast.error("Erro ao iniciar conversa.");
    }
    setLoading(false);
  };

  return (
    <Button variant={variant} size={size} onClick={handleClick} disabled={loading} className={className}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      {label}
    </Button>
  );
}
