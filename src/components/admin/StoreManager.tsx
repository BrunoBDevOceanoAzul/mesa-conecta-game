import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import {
  Store, Plus, Pencil, Trash2, Loader2, MapPin, Phone, Globe, Users, X, Search,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";

interface StoreRow {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  simultaneous_tables: number | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  description: string | null;
  google_place_id: string | null;
  owner_id: string;
  created_at: string;
}

const emptyForm = {
  name: "",
  slug: "",
  address: "",
  city: "",
  state: "",
  lat: null as number | null,
  lng: null as number | null,
  capacity: 20,
  simultaneous_tables: 4,
  phone: "",
  website: "",
  instagram: "",
  description: "",
  google_place_id: "",
  owner_id: "",
};

export function StoreManager() {
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStores = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });
    setStores((data as StoreRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (store: StoreRow) => {
    setEditingId(store.id);
    setForm({
      name: store.name || "",
      slug: store.slug || "",
      address: store.address || "",
      city: store.city || "",
      state: store.state || "",
      lat: store.lat,
      lng: store.lng,
      capacity: store.capacity || 20,
      simultaneous_tables: store.simultaneous_tables || 4,
      phone: store.phone || "",
      website: store.website || "",
      instagram: store.instagram || "",
      description: store.description || "",
      google_place_id: store.google_place_id || "",
      owner_id: store.owner_id || "",
    });
    setDialogOpen(true);
  };

  const handleCityChange = (city: string, lat?: number, lng?: number) => {
    setForm((f) => ({ ...f, city, ...(lat != null ? { lat, lng: lng! } : {}) }));
  };

  // Use Google Places autocomplete for address to get exact coordinates
  const handleAddressSelect = async (placeId: string, description: string) => {
    setForm((f) => ({ ...f, address: description, google_place_id: placeId }));
    try {
      const { data } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "place-details", input: placeId },
      });
      if (data?.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        setForm((f) => ({
          ...f,
          lat,
          lng,
          city: data.result.formatted_address?.split(",").slice(-3, -2)[0]?.trim() || f.city,
        }));
      }
    } catch { /* silent */ }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Auto-generate slug from name if empty
    const autoSlug = form.slug.trim() || form.name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const payload: any = {
      name: form.name.trim(),
      slug: autoSlug,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      lat: form.lat,
      lng: form.lng,
      capacity: form.capacity,
      simultaneous_tables: form.simultaneous_tables,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      instagram: form.instagram.trim() || null,
      description: form.description.trim() || null,
      google_place_id: form.google_place_id.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from("stores").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Luderia atualizada!" });
        setDialogOpen(false);
        fetchStores();
      }
    } else {
      // For admin-created stores without an owner, use the admin's own ID
      const { data: { user } } = await supabase.auth.getUser();
      payload.owner_id = form.owner_id.trim() || user?.id;

      const { error } = await supabase.from("stores").insert(payload);
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Luderia cadastrada!" });
        setDialogOpen(false);
        fetchStores();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta luderia?")) return;
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Luderia excluída" });
      fetchStores();
    }
  };

  const filtered = stores.filter(
    (s) =>
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Gestão de Luderias
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm" className="gap-2" onClick={openNew}>
              <Plus className="h-4 w-4" /> Nova Luderia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Luderia" : "Cadastrar Luderia"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome da luderia" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-gerado do nome" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{`/loja/${form.slug || "..."}`}</p>
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@luderia" />
                </div>
              </div>
              </div>

              <div>
                <Label>Endereço (Google Places)</Label>
                <AddressAutocomplete
                  value={form.address}
                  onSelect={handleAddressSelect}
                  onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                />
                {form.lat && form.lng && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cidade</Label>
                  <CityAutocomplete
                    value={form.city}
                    onChange={handleCityChange}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} placeholder="SP" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Capacidade</Label>
                  <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Mesas simultâneas</Label>
                  <Input type="number" min={1} value={form.simultaneous_tables} onChange={(e) => setForm((f) => ({ ...f, simultaneous_tables: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Sobre a luderia..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancelar</Button>
                </DialogClose>
                <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Buscar por nome ou cidade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma luderia cadastrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Cidade</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden sm:table-cell">Coordenadas</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Capacidade</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((store) => (
                  <tr key={store.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{store.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{store.address || "—"}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-foreground">
                      {store.city || "—"}{store.state ? `, ${store.state}` : ""}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {store.lat && store.lng ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <MapPin className="h-3 w-3" /> OK
                        </span>
                      ) : (
                        <span className="text-xs text-destructive">Sem coord.</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell text-foreground">
                      {store.capacity || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(store)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(store.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Total: {stores.length} luderias · {stores.filter((s) => s.lat && s.lng).length} com geolocalização
      </p>
    </div>
  );
}

/* ── Address autocomplete sub-component using Google Places ── */
function AddressAutocomplete({
  value,
  onSelect,
  onChange,
}: {
  value: string;
  onSelect: (placeId: string, description: string) => void;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState(value || "");
  const [predictions, setPredictions] = useState<{ place_id: string; description: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);
  // containerRef not used in this pattern

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const fetchPredictions = async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "autocomplete", input },
      });
      if (data?.predictions) {
        setPredictions(data.predictions);
        setOpen(true);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    debounceRef[1](setTimeout(() => fetchPredictions(val), 350));
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Buscar endereço..."
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onMouseDown={() => {
                setQuery(p.description);
                setOpen(false);
                onSelect(p.place_id, p.description);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
