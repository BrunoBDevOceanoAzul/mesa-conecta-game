import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, ImageIcon, Pencil, Upload } from "lucide-react";

const SECTION_OPTIONS = [
  { value: "hero", label: "Hero (Banner Principal)" },
  { value: "ambassadors", label: "Embaixadores" },
  { value: "community", label: "Comunidade / Showcase" },
  { value: "profiles", label: "Perfis" },
  { value: "how-it-works", label: "Como Funciona" },
  { value: "differentials", label: "Diferenciais" },
  { value: "pricing", label: "Preços" },
  { value: "faq", label: "FAQ" },
  { value: "cta", label: "CTA Final" },
  { value: "quem-somos", label: "Quem Somos" },
  { value: "contato", label: "Contato" },
  { value: "general", label: "Geral / Outros" },
];

interface SiteImage {
  id: string;
  section_key: string;
  title: string | null;
  alt_text: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export function SiteImageManager() {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SiteImage | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    section_key: "hero",
    title: "",
    alt_text: "",
    image_url: "",
    link_url: "",
    sort_order: 0,
    is_active: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    let q = supabase.from("site_images").select("*").order("section_key").order("sort_order");
    const { data } = await q;
    setImages((data || []) as SiteImage[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = filterSection === "all" ? images : images.filter((i) => i.section_key === filterSection);

  const openCreate = () => {
    setEditing(null);
    setForm({ section_key: "hero", title: "", alt_text: "", image_url: "", link_url: "", sort_order: images.length, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (img: SiteImage) => {
    setEditing(img);
    setForm({
      section_key: img.section_key,
      title: img.title || "",
      alt_text: img.alt_text || "",
      image_url: img.image_url,
      link_url: img.link_url || "",
      sort_order: img.sort_order,
      is_active: img.is_active,
    });
    setDialogOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    setUploading(true);
    const { error } = await supabase.storage.from("site-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("site-images").getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Imagem enviada!" });
  };

  const save = async () => {
    if (!form.image_url.trim()) {
      toast({ title: "Envie ou cole a URL de uma imagem", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      section_key: form.section_key,
      title: form.title.trim() || null,
      alt_text: form.alt_text.trim() || null,
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    if (editing) {
      await supabase.from("site_images").update(payload).eq("id", editing.id);
      toast({ title: "Imagem atualizada" });
    } else {
      await supabase.from("site_images").insert(payload);
      toast({ title: "Imagem adicionada" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const remove = async (id: string) => {
    await supabase.from("site_images").delete().eq("id", id);
    toast({ title: "Imagem removida" });
    fetchAll();
  };

  const sectionLabel = (key: string) => SECTION_OPTIONS.find((s) => s.value === key)?.label || key;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-display font-bold text-foreground">Imagens do Site</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue placeholder="Filtrar seção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as seções</SelectItem>
              {SECTION_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Faça upload de imagens e escolha em qual seção do site elas aparecem.
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma imagem cadastrada{filterSection !== "all" ? " nesta seção" : ""}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((img) => (
            <div key={img.id} className="rounded-xl border border-border bg-card overflow-hidden group">
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={img.image_url}
                  alt={img.alt_text || img.title || ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(img)} className="h-8 gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(img.id)} className="h-8 gap-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                    {sectionLabel(img.section_key)}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${img.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                    {img.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {img.title && <p className="text-xs font-medium text-foreground truncate">{img.title}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Imagem" : "Nova Imagem"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Seção *</Label>
              <Select value={form.section_key} onValueChange={(v) => setForm({ ...form, section_key: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload */}
            <div>
              <Label className="text-xs">Imagem *</Label>
              <div className="mt-1 space-y-2">
                {form.image_url && (
                  <div className="rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                    <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 flex-1"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Enviando..." : "Fazer upload"}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </div>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="Ou cole a URL da imagem"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título opcional" />
              </div>
              <div>
                <Label className="text-xs">Texto alt (SEO)</Label>
                <Input value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} placeholder="Descrição da imagem" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Link (clique na imagem)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>

            <Button className="w-full" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
