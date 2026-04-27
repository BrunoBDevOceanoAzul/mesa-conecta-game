import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, MessageCircle, Send } from "lucide-react";
import Facebook from "lucide-react/dist/esm/icons/facebook";
import Twitter from "lucide-react/dist/esm/icons/twitter";
import Instagram from "lucide-react/dist/esm/icons/instagram";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SharePostModalProps {
  postId: string;
  postSlug: string | null;
  postTitle: string | null;
  trigger?: React.ReactNode;
}

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500", urlFn: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + " " + url)}` },
  { key: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500", urlFn: null },
  { key: "telegram", label: "Telegram", icon: Send, color: "text-blue-400", urlFn: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500", urlFn: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { key: "twitter", label: "X / Twitter", icon: Twitter, color: "text-foreground", urlFn: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-sky-600", urlFn: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { key: "discord", label: "Discord", icon: Copy, color: "text-indigo-400", urlFn: null },
] as const;

function buildUtmUrl(base: string, channel: string, slug: string | null) {
  const params = new URLSearchParams({
    utm_source: channel,
    utm_medium: "social",
    utm_campaign: slug || "post_share",
    utm_content: "share_button",
  });
  return `${base}?${params.toString()}`;
}

export function SharePostModal({ postId, postSlug, postTitle, trigger }: SharePostModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = `${window.location.origin}/post/${postSlug || postId}`;
  const shareText = postTitle || "Confira esse post na HIVIUM";

  const trackShare = async (channel: string) => {
    const trackedUrl = buildUtmUrl(baseUrl, channel, postSlug);
    await supabase.from("post_share_links").insert({
      post_id: postId,
      owner_user_id: user?.id || null,
      channel,
      utm_source: channel,
      utm_medium: "social",
      utm_campaign: postSlug || "post_share",
      utm_content: "share_button",
    });
    // Increment shares count (best-effort)
    await (supabase.from("community_posts") as any).update({ shares: 1 }).eq("id", postId);
    return trackedUrl;
  };

  const handleChannelClick = async (channel: typeof CHANNELS[number]) => {
    const trackedUrl = await trackShare(channel.key);
    if (channel.urlFn) {
      window.open(channel.urlFn(trackedUrl, shareText), "_blank", "noopener,noreferrer");
    } else {
      // Discord = copy link
      await handleCopy(channel.key);
    }
  };

  const handleCopy = async (channel = "copy") => {
    const trackedUrl = channel === "copy" ? await trackShare("copy") : buildUtmUrl(baseUrl, channel, postSlug);
    try {
      await navigator.clipboard.writeText(trackedUrl);
      setCopied(true);
      toast({ title: "Link copiado!", description: "Cole onde quiser compartilhar." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="h-4 w-4" /> Compartilhar
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Compartilhar post</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-3">
          {CHANNELS.map((ch) => (
            <button
              key={ch.key}
              onClick={() => handleChannelClick(ch)}
              className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-hover hover:border-border-strong transition-all"
            >
              <ch.icon className={`h-5 w-5 ${ch.color}`} />
              {ch.label}
            </button>
          ))}

          <div className="pt-2 border-t border-border mt-3">
            <button
              onClick={() => handleCopy()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-hover transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
