import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { invalidateContentCache } from "@/hooks/use-site-content";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, Loader2, FileText, Pencil, Sparkles, Copy, Check,
} from "lucide-react";

const SECTION_OPTIONS = [
  { value: "hero", label: "Hero (Banner Principal)" },
  { value: "community", label: "Comunidade / Showcase" },
  { value: "ambassadors", label: "Embaixadores" },
  { value: "profiles", label: "Perfis" },
  { value: "how-it-works", label: "Como Funciona" },
  { value: "differentials", label: "Diferenciais" },
  { value: "pricing", label: "Preços" },
  { value: "faq", label: "FAQ" },
  { value: "cta", label: "CTA Final" },
  { value: "quem-somos", label: "Quem Somos" },
  { value: "contato", label: "Contato" },
  { value: "footer", label: "Footer" },
  { value: "onboarding", label: "Onboarding" },
  { value: "notifications", label: "Notificações" },
  { value: "paywall", label: "Paywall" },
  { value: "empty-states", label: "Empty States" },
  { value: "campaigns", label: "Campanhas" },
  { value: "general", label: "Geral / Outros" },
];

const CONTENT_TYPES = [
  { value: "headline", label: "Headline" },
  { value: "subheadline", label: "Subtítulo" },
  { value: "cta", label: "CTA (Botão)" },
  { value: "description", label: "Descrição" },
  { value: "body", label: "Corpo de texto" },
  { value: "label", label: "Label / Badge" },
  { value: "tooltip", label: "Tooltip / Hint" },
  { value: "meta", label: "SEO Meta" },
  { value: "notification", label: "Notificação" },
  { value: "error", label: "Mensagem de erro" },
  { value: "success", label: "Mensagem de sucesso" },
];

interface ContentItem {
  id: string;
  section_key: string;
  content_key: string;
  content_value: string;
  content_type: string;
  metadata_json: Record<string, any> | null;
  is_active: boolean;
  sort_order: number;
}

export function SiteContentManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiVariants, setAiVariants] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [form, setForm] = useState({
    section_key: "hero",
    content_key: "",
    content_value: "",
    content_type: "headline",
    sort_order: 0,
    is_active: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_content")
      .select("*")
      .order("section_key")
      .order("sort_order");
    setItems((data || []) as ContentItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = filterSection === "all"
    ? items
    : items.filter((i) => i.section_key === filterSection);

  const openCreate = () => {
    setEditing(null);
    setAiVariants([]);
    setForm({
      section_key: "hero",
      content_key: "",
      content_value: "",
      content_type: "headline",
      sort_order: items.length,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setAiVariants([]);
    setForm({
      section_key: item.section_key,
      content_key: item.content_key,
      content_value: item.content_value,
      content_type: item.content_type,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.content_key.trim() || !form.content_value.trim()) {
      toast({ title: "Chave e conteúdo são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      section_key: form.section_key,
      content_key: form.content_key.trim().toLowerCase().replace(/\s+/g, "_"),
      content_value: form.content_value.trim(),
      content_type: form.content_type,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    if (editing) {
      await supabase.from("site_content").update(payload).eq("id", editing.id);
      toast({ title: "Conteúdo atualizado" });
    } else {
      const { error } = await supabase.from("site_content").insert(payload);
      if (error?.code === "23505") {
        toast({ title: "Chave já existe nesta seção", variant: "destructive" });
        setSaving(false);
        return;
      }
      toast({ title: "Conteúdo adicionado" });
    }

    invalidateContentCache(form.section_key);
    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const remove = async (item: ContentItem) => {
    await supabase.from("site_content").delete().eq("id", item.id);
    invalidateContentCache(item.section_key);
    toast({ title: "Conteúdo removido" });
    fetchAll();
  };

  const generateAiCopy = async () => {
    if (!form.content_value.trim() && !form.content_key.trim()) {
      toast({ title: "Preencha ao menos a chave ou o conteúdo atual", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setAiVariants([]);

    try {
      const sectionLabel = SECTION_OPTIONS.find((s) => s.value === form.section_key)?.label || form.section_key;
      const typeLabel = CONTENT_TYPES.find((t) => t.value === form.content_type)?.label || form.content_type;

      const { data, error } = await supabase.functions.invoke("ai-copy-agency", {
        body: {
          section: sectionLabel,
          content_type: typeLabel,
          content_key: form.content_key,
          current_text: form.content_value,
          brand: "HIVIUM",
          context: "Plataforma premium para o ecossistema tabletop (RPG e jogos de mesa). Tom: sofisticado, magnético, estratégico. Público: jogadores, mestres, lojas/luderias, marcas.",
        },
      });

      if (error) throw error;
      if (data?.variants && Array.isArray(data.variants)) {
        setAiVariants(data.variants);
      } else {
        toast({ title: "Nenhuma variante gerada", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar copy", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const useVariant = (text: string, idx: number) => {
    setForm({ ...form, content_value: text });
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const sectionLabel = (key: string) => SECTION_OPTIONS.find((s) => s.value === key)?.label || key;
  const typeLabel = (key: string) => CONTENT_TYPES.find((t) => t.value === key)?.label || key;

  const groupedBySection = filtered.reduce<Record<string, ContentItem[]>>((acc, item) => {
    (acc[item.section_key] = acc[item.section_key] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-display font-bold text-foreground">Conteúdo Dinâmico</h3>
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
        Gerencie textos dinâmicos do site. Use o botão <Sparkles className="h-3.5 w-3.5 inline text-primary" /> para gerar variações com a agência criativa da HIVIUM.
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : Object.keys(groupedBySection).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum conteúdo cadastrado{filterSection !== "all" ? " nesta seção" : ""}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBySection).map(([section, sectionItems]) => (
            <div key={section} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                <span className="text-xs font-semibold text-foreground">{sectionLabel(section)}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{sectionItems.length} item{sectionItems.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-border/50">
                {sectionItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{item.content_key}</code>
                        <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">{typeLabel(item.content_type)}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                          {item.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{item.content_value}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 pt-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-7 w-7 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(item)} className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Conteúdo" : "Novo Conteúdo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Seção *</Label>
                <Select value={form.section_key} onValueChange={(v) => setForm({ ...form, section_key: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipo *</Label>
                <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Chave identificadora *</Label>
              <Input
                value={form.content_key}
                onChange={(e) => setForm({ ...form, content_key: e.target.value })}
                placeholder="ex: main_headline, sub_description"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Usada no código para puxar este conteúdo.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Conteúdo *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-primary h-7"
                  onClick={generateAiCopy}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {generating ? "Gerando..." : "Gerar com IA"}
                </Button>
              </div>
              <Textarea
                value={form.content_value}
                onChange={(e) => setForm({ ...form, content_value: e.target.value })}
                placeholder="Texto do conteúdo..."
                rows={4}
              />
            </div>

            {/* AI Variants */}
            {aiVariants.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Variantes da Agência Criativa
                </Label>
                {aiVariants.map((variant, idx) => (
                  <div key={idx} className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2">
                    <p className="text-xs text-foreground flex-1 leading-relaxed">{variant}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={() => useVariant(variant, idx)}
                    >
                      {copiedIdx === idx ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

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
