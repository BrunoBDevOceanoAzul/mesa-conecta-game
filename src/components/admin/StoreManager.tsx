import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import { BoardGameSearch } from "@/components/shared/BoardGameSearch";
import {
  Store, Plus, Pencil, Trash2, Loader2, MapPin, Phone, Globe, Users, Search,
  Gamepad2, Eye, Calendar, DollarSign, ChevronDown, ChevronUp, KeyRound,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

/* ─── Types ─── */
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
  cnpj: string | null;
  ecommerce_url: string | null;
  description: string | null;
  google_place_id: string | null;
  owner_id: string;
  created_at: string;
}

interface MesaRow {
  id: string;
  title: string;
  system: string;
  mesa_type: string;
  session_type: string;
  format: string;
  status: string;
  start_at: string;
  end_at: string | null;
  seats_total: number;
  seats_available: number;
  min_price: number | null;
  city: string | null;
  store_id: string | null;
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
  cnpj: "",
  ecommerce_url: "",
  description: "",
  google_place_id: "",
  owner_id: "",
  // New: user provisioning fields
  email: "",
  password: "",
  createUser: true,
};

const emptyMesaForm = {
  title: "",
  system: "boardgame",
  mesa_type: "boardgame" as string,
  session_type: "one-shot" as string,
  format: "presencial" as string,
  start_at: "",
  end_at: "",
  seats_total: 6,
  min_price: 0,
  max_price: 0,
  description: "",
  city: "",
  venue: "",
  board_game_id: null as string | null,
  board_game_name: "",
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

  // Detail / Mesa management
  const [detailStore, setDetailStore] = useState<StoreRow | null>(null);
  const [storeMesas, setStoreMesas] = useState<MesaRow[]>([]);
  const [mesasLoading, setMesasLoading] = useState(false);
  const [mesaDialogOpen, setMesaDialogOpen] = useState(false);
  const [mesaForm, setMesaForm] = useState({ ...emptyMesaForm });
  const [mesaSaving, setMesaSaving] = useState(false);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });
    setStores((data as StoreRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const fetchStoreMesas = useCallback(async (storeOwnerId: string) => {
    setMesasLoading(true);
    const { data } = await supabase
      .from("mesas")
      .select("id, title, system, mesa_type, session_type, format, status, start_at, end_at, seats_total, seats_available, min_price, city, store_id")
      .eq("store_id", storeOwnerId)
      .order("start_at", { ascending: false })
      .limit(50);
    setStoreMesas((data as MesaRow[]) || []);
    setMesasLoading(false);
  }, []);

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
      cnpj: store.cnpj || "",
      ecommerce_url: store.ecommerce_url || "",
      description: store.description || "",
      google_place_id: store.google_place_id || "",
      owner_id: store.owner_id || "",
      email: "",
      password: "",
      createUser: false,
    });
    setDialogOpen(true);
  };

  const handleCityChange = (city: string, lat?: number, lng?: number) => {
    setForm((f) => ({ ...f, city, ...(lat != null ? { lat, lng: lng! } : {}) }));
  };

  const handleAddressSelect = async (placeId: string, description: string) => {
    setForm((f) => ({ ...f, address: description, google_place_id: placeId }));
    try {
      const { data } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "place-details", input: placeId },
      });
      if (data?.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        setForm((f) => ({
          ...f, lat, lng,
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

    const autoSlug = form.slug.trim() || form.name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    if (!editingId && form.createUser) {
      // Create store WITH user account via edge function
      if (!form.email.trim() || !form.password.trim()) {
        toast({ title: "E-mail e senha são obrigatórios para criar conta", variant: "destructive" });
        setSaving(false);
        return;
      }
      if (form.password.length < 6) {
        toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("admin-create-store-user", {
        body: {
          email: form.email.trim(),
          password: form.password.trim(),
          store_name: form.name.trim(),
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
          cnpj: form.cnpj.trim() || null,
          ecommerce_url: form.ecommerce_url.trim() || null,
          description: form.description.trim() || null,
          google_place_id: form.google_place_id.trim() || null,
        },
      });

      if (error || data?.error) {
        toast({ title: "Erro ao criar luderia", description: data?.error || error?.message, variant: "destructive" });
      } else {
        toast({ title: "Luderia criada com conta!", description: `Login: ${form.email.trim()}` });
        setDialogOpen(false);
        fetchStores();
      }
    } else if (editingId) {
      // Update existing store
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
        cnpj: form.cnpj.trim() || null,
        ecommerce_url: form.ecommerce_url.trim() || null,
        description: form.description.trim() || null,
        google_place_id: form.google_place_id.trim() || null,
      };

      const { error } = await supabase.from("stores").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Luderia atualizada!" });
        setDialogOpen(false);
        fetchStores();
      }
    } else {
      // Create store without user account (legacy)
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        name: form.name.trim(),
        slug: autoSlug,
        owner_id: form.owner_id.trim() || user?.id,
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
        cnpj: form.cnpj.trim() || null,
        ecommerce_url: form.ecommerce_url.trim() || null,
        description: form.description.trim() || null,
        google_place_id: form.google_place_id.trim() || null,
      };

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

  // ─── Mesa creation for store ───
  const openMesaDialog = (store: StoreRow) => {
    setDetailStore(store);
    setMesaForm({
      ...emptyMesaForm,
      city: store.city || "",
      venue: store.address || store.name,
    });
    setMesaDialogOpen(true);
  };

  const handleCreateMesa = async () => {
    if (!detailStore) return;
    if (!mesaForm.title.trim()) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }
    if (!mesaForm.start_at) {
      toast({ title: "Data/hora de início é obrigatória", variant: "destructive" });
      return;
    }

    setMesaSaving(true);

    const { error } = await supabase.from("mesas").insert({
      title: mesaForm.title.trim(),
      system: mesaForm.system || "boardgame",
      mesa_type: mesaForm.mesa_type,
      session_type: mesaForm.session_type,
      format: mesaForm.format,
      start_at: mesaForm.start_at,
      end_at: mesaForm.end_at || null,
      seats_total: mesaForm.seats_total,
      seats_available: mesaForm.seats_total,
      min_price: mesaForm.min_price || 0,
      max_price: mesaForm.max_price || mesaForm.min_price || 0,
      description: mesaForm.description.trim() || null,
      city: mesaForm.city.trim() || null,
      venue: mesaForm.venue.trim() || null,
      gm_id: detailStore.owner_id,
      gm_name: detailStore.name,
      organizer_name: detailStore.name,
      store_id: detailStore.owner_id, // store_id = owner's user_id (convention)
      board_game_id: mesaForm.board_game_id || null,
      status: "aberta",
      tags: ["boardgame"],
      address: detailStore.address || null,
      lat: detailStore.lat || null,
      lng: detailStore.lng || null,
    } as any);

    if (error) {
      toast({ title: "Erro ao criar mesa", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mesa criada!", description: `"${mesaForm.title}" na ${detailStore.name}` });
      setMesaDialogOpen(false);
      if (expandedStore === detailStore.id) fetchStoreMesas(detailStore.owner_id);
    }
    setMesaSaving(false);
  };

  const toggleExpand = (store: StoreRow) => {
    if (expandedStore === store.id) {
      setExpandedStore(null);
    } else {
      setExpandedStore(store.id);
      fetchStoreMesas(store.owner_id);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
              <DialogTitle>{editingId ? "Editar Luderia" : "Cadastrar Nova Luderia"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* User provisioning section (new stores only) */}
              {!editingId && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <KeyRound className="h-4 w-4" />
                    Conta de acesso da luderia
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.createUser}
                      onChange={(e) => setForm((f) => ({ ...f, createUser: e.target.checked }))}
                      className="rounded border-border"
                    />
                    Criar conta de login para a luderia
                  </label>
                  {form.createUser && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>E-mail *</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="loja@email.com" />
                      </div>
                      <div>
                        <Label>Senha *</Label>
                        <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 6 caracteres" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>Nome da Luderia *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome da luderia" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Slug (URL)</Label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-gerado" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{`/loja/${form.slug || "..."}`}</p>
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@luderia" />
                </div>
              </div>

              <div>
                <Label>Endereço</Label>
                <AddressAutocomplete
                  value={form.address}
                  onSelect={handleAddressSelect}
                  onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                />
                {form.lat && form.lng && (
                  <p className="text-[10px] text-muted-foreground mt-1">📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cidade</Label>
                  <CityAutocomplete value={form.city} onChange={handleCityChange} placeholder="Cidade" />
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
                  <Label>CNPJ</Label>
                  <Input value={form.cnpj} onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <Label>E-commerce</Label>
                  <Input value={form.ecommerce_url} onChange={(e) => setForm((f) => ({ ...f, ecommerce_url: e.target.value }))} placeholder="https://loja..." />
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
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingId ? "Salvar" : form.createUser ? "Criar Luderia + Conta" : "Cadastrar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar por nome ou cidade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* Store List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma luderia cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((store) => (
            <div key={store.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Store row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{store.name}</span>
                    {store.slug && (
                      <a href={`/loja/${store.slug}`} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-muted/50">
                          <Eye className="h-2.5 w-2.5" /> {store.slug}
                        </Badge>
                      </a>
                    )}
                    {store.lat && store.lng && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-200 bg-green-50">
                        <MapPin className="h-2.5 w-2.5" /> Geo OK
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {store.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{store.city}{store.state ? `, ${store.state}` : ""}</span>}
                    {store.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{store.phone}</span>}
                    {store.instagram && <span>{store.instagram}</span>}
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />Cap. {store.capacity || "?"} · {store.simultaneous_tables || "?"} mesas</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openMesaDialog(store)}>
                    <Plus className="h-3.5 w-3.5" /> Mesa
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => toggleExpand(store)}>
                    <Gamepad2 className="h-3.5 w-3.5" />
                    {expandedStore === store.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(store)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(store.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded mesas */}
              {expandedStore === store.id && (
                <div className="border-t border-border bg-muted/20 p-4">
                  {mesasLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                  ) : storeMesas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">Nenhuma mesa criada para esta luderia.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{storeMesas.length} mesa(s)</p>
                      {storeMesas.map((m) => (
                        <div key={m.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-foreground">{m.title}</span>
                              <Badge variant={m.status === "aberta" ? "default" : "secondary"} className="text-[10px]">
                                {m.status}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{m.mesa_type}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(m.start_at), "dd/MM/yy HH:mm")}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.seats_available}/{m.seats_total}</span>
                              {(m.min_price ?? 0) > 0 && (
                                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />R${m.min_price}</span>
                              )}
                            </div>
                          </div>
                          <a href={`/mesa/${m.id}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-xs gap-1">
                              <Eye className="h-3 w-3" /> Ver
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Total: {stores.length} luderias · {stores.filter((s) => s.lat && s.lng).length} com geolocalização
      </p>

      {/* ─── Create Mesa Dialog ─── */}
      <Dialog open={mesaDialogOpen} onOpenChange={setMesaDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Criar Mesa · {detailStore?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Jogo (buscar no catálogo)</Label>
              <BoardGameSearch
                onSelect={(game) => {
                  setMesaForm((f) => ({
                    ...f,
                    board_game_id: game.id,
                    board_game_name: game.name,
                    title: f.title || `${game.name}`,
                    system: "boardgame",
                    mesa_type: "boardgame",
                    seats_total: game.max_players || f.seats_total,
                  }));
                }}
              />
              {mesaForm.board_game_name && (
                <p className="text-xs text-primary mt-1">🎲 {mesaForm.board_game_name}</p>
              )}
            </div>

            <div>
              <Label>Título da mesa *</Label>
              <Input value={mesaForm.title} onChange={(e) => setMesaForm((f) => ({ ...f, title: e.target.value }))} placeholder="ex: Noite de Catan" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={mesaForm.session_type} onValueChange={(v) => setMesaForm((f) => ({ ...f, session_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-shot">Sessão única</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="torneio">Torneio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato</Label>
                <Select value={mesaForm.format} onValueChange={(v) => setMesaForm((f) => ({ ...f, format: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input type="datetime-local" value={mesaForm.start_at} onChange={(e) => setMesaForm((f) => ({ ...f, start_at: e.target.value }))} />
              </div>
              <div>
                <Label>Término</Label>
                <Input type="datetime-local" value={mesaForm.end_at} onChange={(e) => setMesaForm((f) => ({ ...f, end_at: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Vagas</Label>
                <Input type="number" min={1} max={50} value={mesaForm.seats_total} onChange={(e) => setMesaForm((f) => ({ ...f, seats_total: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" min={0} step={5} value={mesaForm.min_price} onChange={(e) => setMesaForm((f) => ({ ...f, min_price: Number(e.target.value), max_price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={mesaForm.city} onChange={(e) => setMesaForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Local / Endereço</Label>
              <Input value={mesaForm.venue} onChange={(e) => setMesaForm((f) => ({ ...f, venue: e.target.value }))} placeholder="Nome ou endereço do local" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={mesaForm.description} onChange={(e) => setMesaForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Opcional..." />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">Cancelar</Button>
              </DialogClose>
              <Button variant="hero" size="sm" onClick={handleCreateMesa} disabled={mesaSaving}>
                {mesaSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Mesa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Address autocomplete sub-component ── */
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

  useEffect(() => { setQuery(value || ""); }, [value]);

  const fetchPredictions = async (input: string) => {
    if (input.length < 3) { setPredictions([]); return; }
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
