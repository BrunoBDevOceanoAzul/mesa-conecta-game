import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { profilesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Save, Loader2, User, MapPin, Settings, Phone, CreditCard, Gamepad2, Crown, Store, Megaphone, Sparkles, X } from "lucide-react";
import Instagram from "lucide-react/dist/esm/icons/instagram";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { RPG_SYSTEMS } from "@/data/rpg-systems";

const PLAY_STYLES = ["Roleplay intenso", "Combate tático", "Exploração", "Investigação", "Narrativa colaborativa", "Sandbox", "Horror", "Humor"];
const FORMATS = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "hibrido", label: "Híbrido" },
  { value: "ambos", label: "Tanto faz" },
];

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [systemSearch, setSystemSearch] = useState("");

  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    instagram_handle: "",
    city: "",
    whatsapp: "",
    role: "",
    can_play: false,
    can_gm: false,
    can_manage_store: false,
    can_manage_brand: false,
    preferred_systems: [] as string[],
    play_styles: [] as string[],
    preferred_format: "",
    experience_level: "",
  });

  // Billing profile (CPF)
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      profilesApi.getMe().catch(() => null),
      supabase
        .from("billing_profiles")
        .select("tax_document")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([profileData, billingRes]) => {
      if (profileData) {
        setProfile(profileData);
      }
      if (billingRes.data) {
        setCpf(billingRes.data.tax_document || "");
      }
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
    } catch {
      toast.error("Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  };

  const toggleSystem = (sys: string) => {
    setProfile(p => ({
      ...p,
      preferred_systems: p.preferred_systems.includes(sys)
        ? p.preferred_systems.filter(s => s !== sys)
        : [...p.preferred_systems, sys],
    }));
  };

  const toggleStyle = (style: string) => {
    setProfile(p => ({
      ...p,
      play_styles: p.play_styles.includes(style)
        ? p.play_styles.filter(s => s !== style)
        : [...p.play_styles, style],
    }));
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
        [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
      );
    }
    return digits.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) =>
      [a, b ? `.${b}` : "", c ? `.${c}` : "", d ? `/${d}` : "", e ? `-${e}` : ""].join("")
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await profilesApi.updateMe({
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        instagram_handle: profile.instagram_handle,
        city: profile.city,
        whatsapp: profile.whatsapp,
        role: profile.role,
        can_play: profile.can_play,
        can_gm: profile.can_gm,
        can_manage_store: profile.can_manage_store,
        can_manage_brand: profile.can_manage_brand,
        preferred_systems: profile.preferred_systems,
        play_styles: profile.play_styles,
        preferred_format: profile.preferred_format,
        experience_level: profile.experience_level,
      });

      const cleanCpf = cpf.replace(/\D/g, "");
      const billingUpdate = cleanCpf
        ? supabase
            .from("billing_profiles")
            .upsert({ user_id: user.id, tax_document: cleanCpf }, { onConflict: "user_id" })
        : Promise.resolve({ error: null });

      const bRes = await billingUpdate;
      if (bRes.error) toast.error("Erro ao salvar dados financeiros.");
      else toast.success("Perfil atualizado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const filteredSystems = systemSearch.length >= 2
    ? RPG_SYSTEMS.filter(s => s.toLowerCase().includes(systemSearch.toLowerCase())).slice(0, 12)
    : [];

  const navItems = [
    { label: "Meu Perfil", path: "/perfil", icon: <User className="h-4 w-4" /> },
    { label: "Configurações", path: "/configuracoes", icon: <Settings className="h-4 w-4" /> },
  ];

  if (loading) return (
    <DashboardLayout role="player" navItems={navItems}>
      <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="player" navItems={navItems} userName={profile.display_name || "Usuário"}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-h2 text-foreground">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Edite suas informações públicas e preferências de jogo</p>
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

        {/* Basic Info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Informações Básicas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Nome de exibição</label>
              <Input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <label className="field-label flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Cidade</label>
              <Input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="São Paulo, SP" className="mt-1.5" />
            </div>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" /> Instagram</label>
              <Input value={profile.instagram_handle} onChange={e => setProfile(p => ({ ...p, instagram_handle: e.target.value.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30) }))} placeholder="seu.usuario" className="mt-1.5" />
            </div>
            <div>
              <label className="field-label flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> WhatsApp</label>
              <Input value={profile.whatsapp} onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 13) }))} placeholder="5511999999999" className="mt-1.5" />
            </div>
          </div>
        </section>

        {/* CPF/CNPJ */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> Dados Financeiros
          </h2>
          <p className="text-xs text-muted-foreground">Necessário para pagamentos e assinaturas via PIX.</p>
          <div>
            <label className="field-label">CPF ou CNPJ</label>
            <Input
              value={formatCpf(cpf)}
              onChange={e => setCpf(e.target.value.replace(/\D/g, ""))}
              placeholder="000.000.000-00"
              className="mt-1.5 font-mono"
            />
          </div>
        </section>

        {/* Role & Capabilities */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Tipo de Perfil
          </h2>
          <div>
            <label className="field-label">Perfil principal</label>
            <Select value={profile.role} onValueChange={v => setProfile(p => ({ ...p, role: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Jogador</SelectItem>
                <SelectItem value="gm">Mestre</SelectItem>
                <SelectItem value="store">Luderia / Loja</SelectItem>
                <SelectItem value="brand">Marca / Editora</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="field-label">Capacidades adicionais</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "can_play" as const, label: "Jogador", icon: Gamepad2, color: "text-plum-500" },
                { key: "can_gm" as const, label: "Mestre", icon: Crown, color: "text-gold-500" },
                { key: "can_manage_store" as const, label: "Luderia", icon: Store, color: "text-teal-500" },
                { key: "can_manage_brand" as const, label: "Marca", icon: Megaphone, color: "text-coral-400" },
              ].map(cap => (
                <div key={cap.key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <cap.icon className={`h-4 w-4 ${cap.color}`} />
                    <span className="text-sm text-foreground">{cap.label}</span>
                  </div>
                  <Switch
                    checked={profile[cap.key]}
                    onCheckedChange={v => setProfile(p => ({ ...p, [cap.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gaming Preferences */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-primary" /> Preferências de Jogo
          </h2>

          <div>
            <label className="field-label">Nível de experiência</label>
            <Select value={profile.experience_level} onValueChange={v => setProfile(p => ({ ...p, experience_level: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iniciante">Iniciante</SelectItem>
                <SelectItem value="intermediario">Intermediário</SelectItem>
                <SelectItem value="avancado">Avançado</SelectItem>
                <SelectItem value="veterano">Veterano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="field-label">Formato preferido</label>
            <Select value={profile.preferred_format} onValueChange={v => setProfile(p => ({ ...p, preferred_format: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {FORMATS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Play Styles */}
          <div>
            <label className="field-label">Estilos de jogo</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLAY_STYLES.map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    profile.play_styles.includes(style)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Systems */}
          <div>
            <label className="field-label">Sistemas favoritos</label>
            {profile.preferred_systems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                {profile.preferred_systems.map(sys => (
                  <Badge key={sys} variant="secondary" className="gap-1 text-xs">
                    {sys}
                    <button onClick={() => toggleSystem(sys)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <Input
              value={systemSearch}
              onChange={e => setSystemSearch(e.target.value)}
              placeholder="Buscar sistema (ex: D&D, Call of Cthulhu...)"
              className="mt-1.5"
            />
            {filteredSystems.length > 0 && (
              <div className="mt-2 border border-border rounded-lg max-h-40 overflow-y-auto">
                {filteredSystems.map(sys => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => { toggleSystem(sys); setSystemSearch(""); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                      profile.preferred_systems.includes(sys) ? "text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </Button>
      </div>
    </DashboardLayout>
  );
}
