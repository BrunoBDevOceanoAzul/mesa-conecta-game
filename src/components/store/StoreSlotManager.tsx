import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon, Clock, Plus, Trash2, Users, LayoutGrid,
  ChevronLeft, ChevronRight, Loader2, Copy, AlertCircle
} from "lucide-react";

interface StoreSlot {
  id: string;
  store_id: string;
  owner_user_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_tables: number;
  max_seats: number;
  tables_booked: number;
  seats_booked: number;
  status: string;
  recurrence_rule: string | null;
  recurrence_group_id: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  storeId: string;
}

const TIME_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const h = Math.floor(i / 2) + 8; // 08:00 to 22:30
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Apenas este dia" },
  { value: "weekly", label: "Toda semana" },
  { value: "biweekly", label: "Quinzenal" },
];

export function StoreSlotManager({ storeId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [slots, setSlots] = useState<StoreSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });

  // New slot form
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newStartTime, setNewStartTime] = useState("14:00");
  const [newEndTime, setNewEndTime] = useState("18:00");
  const [newMaxTables, setNewMaxTables] = useState("2");
  const [newMaxSeats, setNewMaxSeats] = useState("10");
  const [newNotes, setNewNotes] = useState("");
  const [newRecurrence, setNewRecurrence] = useState("none");

  const fetchSlots = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const from = format(currentWeekStart, "yyyy-MM-dd");
    const to = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

    const { data } = await supabase
      .from("store_time_slots")
      .select("*")
      .eq("store_id", storeId)
      .gte("slot_date", from)
      .lte("slot_date", to)
      .order("slot_date")
      .order("start_time");

    setSlots((data as StoreSlot[]) || []);
    setLoading(false);
  }, [user, storeId, currentWeekStart]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const resetForm = () => {
    setNewDate(undefined);
    setNewStartTime("14:00");
    setNewEndTime("18:00");
    setNewMaxTables("2");
    setNewMaxSeats("10");
    setNewNotes("");
    setNewRecurrence("none");
  };

  const handleCreate = async () => {
    if (!user || !newDate) return;
    if (newStartTime >= newEndTime) {
      toast({ title: "Horário inválido", description: "O fim deve ser após o início.", variant: "destructive" });
      return;
    }

    setCreating(true);
    const groupId = newRecurrence !== "none" ? crypto.randomUUID() : null;
    const datesToCreate: string[] = [];
    const baseDate = newDate;

    if (newRecurrence === "none") {
      datesToCreate.push(format(baseDate, "yyyy-MM-dd"));
    } else {
      const weeks = newRecurrence === "weekly" ? 1 : 2;
      for (let i = 0; i < 8; i++) {
        datesToCreate.push(format(addDays(baseDate, i * weeks * 7), "yyyy-MM-dd"));
      }
    }

    const rows = datesToCreate.map((d) => ({
      store_id: storeId,
      owner_user_id: user.id,
      slot_date: d,
      start_time: newStartTime,
      end_time: newEndTime,
      max_tables: parseInt(newMaxTables) || 2,
      max_seats: parseInt(newMaxSeats) || 10,
      status: "available",
      recurrence_rule: newRecurrence === "none" ? null : newRecurrence,
      recurrence_group_id: groupId,
      notes: newNotes.trim() || null,
    }));

    const { error } = await supabase.from("store_time_slots").insert(rows);

    if (error) {
      toast({ title: "Erro ao criar slot", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${datesToCreate.length} slot(s) criado(s)!` });
      resetForm();
      setDialogOpen(false);
      fetchSlots();
    }
    setCreating(false);
  };

  const handleDelete = async (slotId: string) => {
    const { error } = await supabase.from("store_time_slots").delete().eq("id", slotId);
    if (!error) {
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast({ title: "Slot removido" });
    }
  };

  const prevWeek = () => setCurrentWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setCurrentWeekStart((w) => addDays(w, 7));
  const goToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getSlotsForDay = (day: Date) =>
    slots.filter((s) => isSameDay(parseISO(s.slot_date), day));

  const occupancyColor = (slot: StoreSlot) => {
    const pct = slot.max_tables > 0 ? slot.tables_booked / slot.max_tables : 0;
    if (pct >= 1) return "bg-destructive/10 border-destructive/30 text-destructive";
    if (pct >= 0.7) return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-teal-50 border-teal-200 text-teal-700";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground">Slots de Agendamento</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Controle a ocupação definindo horários disponíveis para mesas.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Novo Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Criar Slot de Horário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDate ? format(newDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDate}
                      onSelect={setNewDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Início</Label>
                  <Select value={newStartTime} onValueChange={setNewStartTime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fim</Label>
                  <Select value={newEndTime} onValueChange={setNewEndTime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3" /> Mesas simultâneas
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={newMaxTables}
                    onChange={(e) => setNewMaxTables(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Users className="h-3 w-3" /> Capacidade total
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={newMaxSeats}
                    onChange={(e) => setNewMaxSeats(e.target.value)}
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Copy className="h-3 w-3" /> Recorrência
                </Label>
                <Select value={newRecurrence} onValueChange={setNewRecurrence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newRecurrence !== "none" && (
                  <p className="text-[10px] text-muted-foreground">
                    Serão criados 8 slots automaticamente ({newRecurrence === "weekly" ? "semanais" : "quinzenais"}).
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Observações (opcional)</Label>
                <Textarea
                  placeholder="Ex: Evento especial, reserva para grupo..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                variant="gradient"
                className="w-full gap-2"
                disabled={!newDate || creating}
                onClick={handleCreate}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? "Criando…" : "Criar Slot"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {format(currentWeekStart, "dd MMM", { locale: ptBR })} — {format(addDays(currentWeekStart, 6), "dd MMM yyyy", { locale: ptBR })}
          </p>
          <button onClick={goToday} className="text-[10px] text-primary hover:underline">
            Ir para hoje
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekly grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const daySlots = getSlotsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isPast = !isAfter(day, addDays(new Date(), -1));

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-xl border p-3 min-h-[140px] transition-colors",
                  isToday ? "border-primary/40 bg-primary/5" : "border-border bg-card",
                  isPast && "opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {format(day, "EEE", { locale: ptBR })}
                    </p>
                    <p className={cn("text-lg font-display font-bold", isToday ? "text-primary" : "text-foreground")}>
                      {format(day, "dd")}
                    </p>
                  </div>
                  {daySlots.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-5">
                      {daySlots.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-[11px] space-y-0.5 group relative",
                        occupancyColor(slot)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                        </span>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="flex items-center gap-0.5">
                          <LayoutGrid className="h-2.5 w-2.5" />
                          {slot.tables_booked}/{slot.max_tables}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {slot.seats_booked}/{slot.max_seats}
                        </span>
                      </div>
                      {slot.notes && (
                        <p className="text-[9px] opacity-70 truncate">{slot.notes}</p>
                      )}
                    </div>
                  ))}
                  {daySlots.length === 0 && !isPast && (
                    <p className="text-[10px] text-muted-foreground/50 text-center pt-2">
                      Sem slots
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Occupancy summary */}
      {slots.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resumo da Semana
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">{slots.length}</p>
              <p className="text-[10px] text-muted-foreground">Slots</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {slots.reduce((a, s) => a + s.tables_booked, 0)}/{slots.reduce((a, s) => a + s.max_tables, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Mesas ocupadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {slots.reduce((a, s) => a + s.seats_booked, 0)}/{slots.reduce((a, s) => a + s.max_seats, 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Assentos</p>
            </div>
            <div className="text-center">
              {(() => {
                const totalTables = slots.reduce((a, s) => a + s.max_tables, 0);
                const booked = slots.reduce((a, s) => a + s.tables_booked, 0);
                const pct = totalTables > 0 ? Math.round((booked / totalTables) * 100) : 0;
                return (
                  <>
                    <p className={cn(
                      "text-2xl font-display font-bold",
                      pct >= 80 ? "text-destructive" : pct >= 50 ? "text-amber-600" : "text-teal-600"
                    )}>
                      {pct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Ocupação</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
