import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Users, GripVertical, Pencil } from "lucide-react";

interface Ambassador {
  id: string;
  name: string;
  role_label: string;
  avatar_url: string | null;
  profile_slug: string | null;
  profile_type: string | null;
  sort_order: number;
  is_active: boolean;
}

export function AmbassadorManager() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ambassador | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    role_label: "Mestre",
    avatar_url: "",
    profile_slug: "",
    profile_type: "gm",
    sort_order: 0,
    is_active: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ambassadors")
      .select("*")
      .order("sort_order");
    setAmbassadors((data || []) as unknown as Ambassador[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", role_label: "Mestre", avatar_url: "", profile_slug: "", profile_type: "gm", sort_order: ambassadors.length, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (a: Ambassador) => {
    setEditing(a);
    setForm({
      name: a.name,
      role_label: a.role_label,
      avatar_url: a.avatar_url || "",
      profile_slug: a.profile_slug || "",
      profile_type: a.profile_type || "gm",
      sort_order: a.sort_order,
      is_active: a.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      role_label: form.role_label.trim(),
      avatar_url: form.avatar_url.trim() || null,
      profile_slug: form.profile_slug.trim() || null,
      profile_type: form.profile_type,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    if (editing) {
      await (supabase.from("ambassadors").update(payload as any) as any).eq("id", editing.id);
      toast({ title: "Embaixador atualizado" });
    } else {
      await (supabase.from("ambassadors").insert(payload as any) as any);
      toast({ title: "Embaixador adicionado" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const remove = async (id: string) => {
    await (supabase.from("ambassadors").delete() as any).eq("id", id);
    toast({ title: "Embaixador removido" });
    fetchAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-display font-bold text-foreground">Embaixadores</h3>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Gerencie os embaixadores exibidos na página inicial.
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : ambassadors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum embaixador cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ambassadors.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {a.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.role_label} · Ordem: {a.sort_order}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                {a.is_active ? "Ativo" : "Inativo"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => openEdit(a)} className="h-8 w-8 p-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove(a.id)} className="h-8 w-8 p-0 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Embaixador" : "Novo Embaixador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do embaixador" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Papel</Label>
                <select
                  value={form.role_label}
                  onChange={(e) => setForm({ ...form, role_label: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option>Mestre</option>
                  <option>Loja</option>
                  <option>Jogador</option>
                  <option>Conselheiro</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Tipo de perfil</Label>
                <select
                  value={form.profile_type}
                  onChange={(e) => setForm({ ...form, profile_type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <option value="gm">Mestre</option>
                  <option value="store">Loja</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">URL do Avatar</Label>
              <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">Slug do perfil público</Label>
              <Input value={form.profile_slug} onChange={(e) => setForm({ ...form, profile_slug: e.target.value })} placeholder="slug-do-perfil" />
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
