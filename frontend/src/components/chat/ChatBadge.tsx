import { useRouter } from "next/router";
import { useConversations } from "@/hooks/use-chat";
import { MessageCircle } from "lucide-react";

export function ChatBadge() {
  const router = useRouter();
  const { totalUnread } = useConversations();

  return (
    <button
      onClick={() => router.push("/mensagens")}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <MessageCircle className="h-5 w-5" />
      {totalUnread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-in zoom-in-50">
          {totalUnread > 9 ? "9+" : totalUnread}
        </span>
      )}
    </button>
  );
}
