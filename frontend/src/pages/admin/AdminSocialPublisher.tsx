import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Share2, Sparkles, Loader2, Copy, Check, ExternalLink,
  MessageCircle, Send, Facebook, Twitter, Instagram, Linkedin,
  Link2, Trash2, BarChart3, Globe
} from "lucide-react";

const ALL_CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
  { key: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { key: "telegram", label: "Telegram", icon: Send, color: "text-blue-400" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { key: "twitter", label: "X / Twitter", icon: Twitter, color: "text-foreground" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-sky-600" },
  { key: "discord", label: "Discord", icon: MessageCircle, color: "text-indigo-400" },
];

function generateShortCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

interface ShareLink {
  id: string;
  title: string;
  description: string | null;
  original_url: string;
  short_code: string;
  channels: string[];
  utm_campaign: string | null;
  clicks: number;
  is_active: boolean;
  ai_generated_text: string | null;
  created_at: string;
}

export default function AdminSocialPublisher() {
  const { user } = useAuth();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [campaign, setCampaign] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["whatsapp", "instagram", "linkedin"]);
  const [generating, setGenerating] = useState(false);
  const [aiText, setAiText] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data } = await (supabase as any)
      .from("admin_share_links")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLinks(data || []);
    setLoading(false);
  };

  const generateAiText = async () => {
    if (!title && !originalUrl) {
      toast({ title: "Preencha ao menos o título ou URL", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("mesa-ai-assist", {
        body: {
          action: "generate_social_post",
          title,
          description,
          url: originalUrl,
          channels: selectedChannels,
        },
      });
      if (error) throw error;
      const result = data?.result?.text || data?.result || "";
      setAiText(typeof result === "string" ? result : JSON.stringify(result));
      toast({ title: "Texto gerado com IA! ✨" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar texto", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!title || !originalUrl) {
      toast({ title: "Título e URL são obrigatórios", variant: "destructive" });
      return;
    }
    if (selectedChannels.length === 0) {
      toast({ title: "Selecione ao menos um canal", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const shortCode = generateShortCode();
      const campaignSlug = campaign || title.toLowerCase().replace(/\s+/g, "_").substring(0, 40);

      const { error } = await (supabase as any).from("admin_share_links").insert({
        admin_user_id: user?.id,
        title,
        description: description || null,
        original_url: originalUrl,
        short_code: shortCode,
        channels: selectedChannels,
        utm_source: "hivium_admin",
        utm_campaign: campaignSlug,
        utm_content: "admin_publish",
        ai_generated_text: aiText || null,
      });
      if (error) throw error;

      toast({ title: "Link publicado com sucesso! 🚀" });
      setTitle("");
      setDescription("");
      setOriginalUrl("");
      setCampaign("");
      setAiText("");
      fetchLinks();
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const buildTrackedUrl = (link: ShareLink, channel: string) => {
    const params = new URLSearchParams({
      utm_source: channel,
      utm_medium: "social",
      utm_campaign: link.utm_campaign || "admin_share",
      utm_content: "admin_publish",
      ref: link.short_code,
    });
    return `${link.original_url}${link.original_url.includes("?") ? "&" : "?"}${params.toString()}`;
  };

  const handleCopy = async (link: ShareLink, channel: string) => {
    const url = buildTrackedUrl(link, channel);
    const text = link.ai_generated_text
      ? `${link.ai_generated_text}\n\n${url}`
      : `${link.title}\n${url}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(`${link.id}-${channel}`);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenShare = (link: ShareLink, channel: string) => {
    const url = buildTrackedUrl(link, channel);
    const text = link.ai_generated_text || link.title;
    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    if (shareUrls[channel]) {
      window.open(shareUrls[channel], "_blank", "noopener,noreferrer");
    } else {
      handleCopy(link, channel);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from("admin_share_links").update({ is_active: !current }).eq("id", id);
    fetchLinks();
  };

  const toggleChannel = (key: string) => {
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Publicador Social</h1>
            <p className="text-sm text-muted-foreground">Crie links rastreáveis com UTM e texto gerado por IA</p>
          </div>
        </div>

        {/* Creator Form */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Novo Link Rastreável
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Nova funcionalidade de mesas" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">URL original *</label>
              <Input value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} placeholder="https://hivium.com/..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contexto adicional..." className="min-h-[60px]" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Campanha UTM (slug)</label>
            <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="auto-gerado a partir do título" />
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Canais de distribuição</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => toggleChannel(ch.key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedChannels.includes(ch.key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <ch.icon className={`h-3.5 w-3.5 ${selectedChannels.includes(ch.key) ? "text-primary" : ch.color}`} />
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Text Generator */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Texto com IA
              </span>
              <Button size="sm" variant="ghost" onClick={generateAiText} disabled={generating} className="text-xs gap-1.5">
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Gerar
              </Button>
            </div>
            <Textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Texto que será compartilhado junto com o link..."
              className="min-h-[80px] text-xs"
            />
          </div>

          <Button onClick={handlePublish} disabled={saving || !title || !originalUrl} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Publicar Link Rastreável
          </Button>
        </Card>

        {/* Links List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Links Publicados ({links.length})
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : links.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum link publicado ainda.</p>
          ) : (
            links.map((link) => (
              <Card key={link.id} className={`p-4 space-y-3 ${!link.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{link.title}</h3>
                      <Badge variant={link.is_active ? "default" : "secondary"} className="text-[10px]">
                        {link.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{link.original_url}</p>
                    {link.utm_campaign && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        utm_campaign: <span className="font-mono">{link.utm_campaign}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {link.clicks}</span>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(link.id, link.is_active)} className="h-7 px-2 text-xs">
                      {link.is_active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>

                {link.ai_generated_text && (
                  <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-foreground whitespace-pre-wrap">
                    {link.ai_generated_text}
                  </div>
                )}

                {/* Channel buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {link.channels.map((chKey) => {
                    const ch = ALL_CHANNELS.find((c) => c.key === chKey);
                    if (!ch) return null;
                    const isCopied = copiedId === `${link.id}-${chKey}`;
                    return (
                      <div key={chKey} className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleOpenShare(link, chKey)}
                          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:bg-muted transition-colors"
                        >
                          <ch.icon className={`h-3 w-3 ${ch.color}`} />
                          {ch.label}
                          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleCopy(link, chKey)}
                          className="rounded-md border border-border p-1 hover:bg-muted transition-colors"
                          title="Copiar link"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  ref: <span className="font-mono">{link.short_code}</span> · {new Date(link.created_at).toLocaleDateString("pt-BR")}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}