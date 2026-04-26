import { useState, useRef } from "react";
import { Camera, User, Instagram, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BioAvatarStepProps {
  bio: string;
  avatarUrl: string;
  instagramHandle: string;
  onBioChange: (bio: string) => void;
  onAvatarChange: (url: string) => void;
  onInstagramChange: (handle: string) => void;
}

export function BioAvatarStep({ bio, avatarUrl, instagramHandle, onBioChange, onAvatarChange, onInstagramChange }: BioAvatarStepProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const maxChars = 160;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      await supabase.storage.from("avatars").upload(path, file, { upsert: true });

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      if (data?.publicUrl) {
        onAvatarChange(`${data.publicUrl}?t=${Date.now()}`);
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const generateBioWithAI = async () => {
    if (!user) return;
    setGeneratingBio(true);
    try {
      // Fetch profile data for context
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role, preferred_systems, city")
        .eq("id", user.id)
        .maybeSingle();

      const context = [
        profile?.display_name ? `Nome: ${profile.display_name}` : "",
        profile?.role ? `Perfil: ${profile.role}` : "",
        profile?.preferred_systems?.length ? `Sistemas favoritos: ${profile.preferred_systems.join(", ")}` : "",
        profile?.city ? `Cidade: ${profile.city}` : "",
        instagramHandle ? `Instagram: @${instagramHandle}` : "",
      ].filter(Boolean).join("\n");

      const { data, error } = await supabase.functions.invoke("mesa-ai-assist", {
        body: {
          action: "generate_bio",
          context,
        },
      });

      if (error) throw error;
      const generatedBio = data?.bio || data?.result?.bio;
      if (generatedBio) {
        onBioChange(generatedBio.slice(0, maxChars));
        toast.success("Bio gerada! Edite como quiser.");
      } else {
        throw new Error("Nenhuma bio gerada");
      }
    } catch (err: any) {
      console.error("Bio AI error:", err);
      toast.error("Erro ao gerar bio. Tente novamente.");
    } finally {
      setGeneratingBio(false);
    }
  };

  const sanitizeHandle = (val: string) => {
    return val.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30);
  };

  return (
    <div className="space-y-8">
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "relative h-28 w-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 group",
            avatarUrl
              ? "border-primary/40"
              : "border-border/40 hover:border-primary/30"
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-muted-foreground/30" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Camera className="h-5 w-5 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-full">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <p className="text-xs text-muted-foreground/50">Toque para adicionar sua foto</p>
      </div>

      {/* Bio textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em]">
            Mini bio
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateBioWithAI}
            disabled={generatingBio}
            className="h-7 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-full px-3"
          >
            {generatingBio ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generatingBio ? "Criando..." : "Criar com IA"}
          </Button>
        </div>
        <textarea
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) onBioChange(e.target.value);
          }}
          placeholder="Conte um pouco sobre você em uma frase..."
          rows={3}
          className="w-full rounded-2xl border border-border/30 bg-card/30 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 resize-none transition-all"
        />
        <div className="flex justify-end mt-1.5">
          <span className={cn(
            "text-[11px] font-medium transition-colors",
            bio.length >= maxChars ? "text-destructive" : "text-muted-foreground/40"
          )}>
            {bio.length}/{maxChars}
          </span>
        </div>
      </div>

      {/* Instagram handle */}
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] mb-2 block">
          Instagram (opcional)
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-muted-foreground/40">
            <Instagram className="h-4 w-4" />
            <span className="text-sm">@</span>
          </div>
          <input
            type="text"
            value={instagramHandle}
            onChange={(e) => onInstagramChange(sanitizeHandle(e.target.value))}
            placeholder="seu.usuario"
            className="w-full rounded-2xl border border-border/30 bg-card/30 pl-14 pr-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 transition-all"
          />
        </div>
        <p className="text-[11px] text-muted-foreground/40 mt-1.5">
          Será exibido no seu perfil público para a comunidade te seguir
        </p>
      </div>
    </div>
  );
}
