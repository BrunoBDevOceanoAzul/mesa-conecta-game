import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, MessageCircle, Send, Link2, X } from "lucide-react";
import Facebook from "lucide-react/dist/esm/icons/facebook";
import Twitter from "lucide-react/dist/esm/icons/twitter";
import Instagram from "lucide-react/dist/esm/icons/instagram";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";

interface ShareModalProps {
  entityType: string;
  entityId: string;
  entityTitle: string;
  entitySlug?: string;
  onClose: () => void;
}

const channels = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-600 hover:bg-green-700" },
  { key: "instagram", label: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600" },
  { key: "telegram", label: "Telegram", icon: Send, color: "bg-blue-500 hover:bg-blue-600" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-700 hover:bg-blue-800" },
  { key: "twitter", label: "X / Twitter", icon: Twitter, color: "bg-foreground/80 hover:bg-foreground" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-sky-700 hover:bg-sky-800" },
  { key: "discord", label: "Discord", icon: MessageCircle, color: "bg-indigo-600 hover:bg-indigo-700" },
];

function generateShortCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

export function ShareModal({ entityType, entityId, entityTitle, entitySlug, onClose }: ShareModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const baseUrl = window.location.origin;
  const entityPath = entityType === "mesa" ? `/mesa/${entityId}` : `/${entityType}/${entityId}`;

  const buildTrackedUrl = useCallback((channel: string) => {
    const slug = entitySlug || entityId;
    const params = new URLSearchParams({
      utm_source: channel,
      utm_medium: "social",
      utm_campaign: `${entityType}_${slug}`,
      utm_content: "share_button",
    });
    return `${baseUrl}${entityPath}?${params.toString()}`;
  }, [baseUrl, entityPath, entityType, entitySlug, entityId]);

  const saveShareLink = async (channel: string) => {
    if (!user) return null;
    const trackedUrl = buildTrackedUrl(channel);
    const shortCode = generateShortCode();

    const { data } = await (supabase as any).from("share_links").insert({
      owner_user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      channel,
      original_url: `${baseUrl}${entityPath}`,
      tracked_url: trackedUrl,
      short_code: shortCode,
      utm_source: channel,
      utm_medium: "social",
      utm_campaign: `${entityType}_${entitySlug || entityId}`,
      utm_content: "share_button",
    }).select().single();

    return data;
  };

  const ogImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/og-image?type=${entityType}&id=${entityId}`;

  const handleShare = async (channel: string) => {
    setGenerating(true);
    await saveShareLink(channel);
    const url = buildTrackedUrl(channel);
    const text = `Confira esta mesa: ${entityTitle}`;

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      instagram: url, // Instagram doesn't have a direct share URL — copy link
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      discord: url,
    };

    const copyChannels = ["discord", "instagram"];
    if (copyChannels.includes(channel)) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.open(shareUrls[channel], "_blank", "noopener,noreferrer");
    }
    setGenerating(false);
  };

  const handleCopyLink = async () => {
    await saveShareLink("link_copy");
    const url = buildTrackedUrl("link_copy");
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">Compartilhar Mesa</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{entityTitle}</p>
          </div>
        </div>

        {/* OG Image Preview */}
        <div className="mb-4 rounded-lg overflow-hidden border border-border bg-muted/30">
          <img
            src={ogImageUrl}
            alt="Preview do link"
            className="w-full h-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground">Preview ao compartilhar nas redes sociais</p>
        </div>

        {/* Social channels */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {channels.map((ch) => (
            <button
              key={ch.key}
              onClick={() => handleShare(ch.key)}
              disabled={generating}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-primary-foreground transition-all ${ch.color} disabled:opacity-50`}
            >
              <ch.icon className="h-4 w-4" />
              {ch.label}
            </button>
          ))}
        </div>

        {/* Copy link */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Link com rastreamento</label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-muted-foreground truncate">
              {buildTrackedUrl("link_copy")}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground text-center">
          Cada link é rastreado. Veja métricas por canal no seu painel.
        </p>
      </div>
    </div>
  );
}

/* Simple trigger button */
export function ShareButton({ entityType, entityId, entityTitle, entitySlug }: Omit<ShareModalProps, "onClose">) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Share2 className="h-4 w-4" /> Compartilhar
      </Button>
      {open && (
        <ShareModal
          entityType={entityType}
          entityId={entityId}
          entityTitle={entityTitle}
          entitySlug={entitySlug}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
