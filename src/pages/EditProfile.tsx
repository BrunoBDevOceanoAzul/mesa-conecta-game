import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2, Instagram, User, MapPin, Gamepad2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    instagram_handle: "",
    city: "",
    preferred_systems: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, bio, avatar_url, instagram_handle, city, preferred_systems")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({
          display_name: data.display_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          instagram_handle: data.instagram_handle || "",
          city: data.city || "",
          preferred_systems: data.preferred_systems || [],
        });
        setLoading(false);
      });
  }, [user]);

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
        setProfile(p => ({ ...p, avatar_url: `${data.publicUrl}?t=${Date.now()}` }));
      }
    } catch { toast.error("Erro ao enviar foto."); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        instagram_handle: profile.instagram_handle,
        city: profile.city,
      })
      .eq("user_id", user.id);

    if (error) toast.error("Erro ao salvar.");
    else toast.success("Perfil atualizado!");
    setSaving(false);
  };

  const navItems = [
    { label: "Meu Perfil", path: "/perfil", icon: <User className="h-4 w-4" /> },
    { label: "Configurações", path: "/configuracoes", icon: <Gamepad2 className="h-4 w-4" /> },
  ];

  if (loading) return <DashboardLayout role="player" navItems={navItems}><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></DashboardLayout>;

  return (
    <DashboardLayout role="player" navItems={navItems} userName={profile.display_name || "Usuário"}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-h2 text-foreground">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Edite suas informações públicas</p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-primary/10">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {(profile.display_name || "U").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        <div className="space-y-5">
          <div>
            <label className="field-label">Nome de exibição</label>
            <Input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <label className="field-label">Mini Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => { if (e.target.value.length <= 160) setProfile(p => ({ ...p, bio: e.target.value })); }}
              rows={3}
              className="field-input resize-none"
              placeholder="Conte um pouco sobre você..."
            />
            <p className="text-[11px] text-muted-foreground/50 text-right mt-1">{profile.bio.length}/160</p>
          </div>
          <div>
            <label className="field-label flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" /> Instagram</label>
            <Input value={profile.instagram_handle} onChange={e => setProfile(p => ({ ...p, instagram_handle: e.target.value.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30) }))} placeholder="seu.usuario" className="mt-1.5" />
          </div>
          <div>
            <label className="field-label flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Cidade</label>
            <Input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="São Paulo, SP" className="mt-1.5" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>
    </DashboardLayout>
  );
}
