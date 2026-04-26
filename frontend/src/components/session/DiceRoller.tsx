import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dices, Plus, Minus, Eye, EyeOff } from "lucide-react";

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const;

interface DiceRoll {
  id: string;
  user_name: string | null;
  roll_formula: string;
  result_json: number[];
  total_result: number;
  modifier: number;
  visibility: string;
  created_at: string;
}

interface Props {
  mesaId: string;
  sessionId?: string | null;
}

export function DiceRoller({ mesaId, sessionId }: Props) {
  const { user } = useAuth();
  const [diceType, setDiceType] = useState<number>(20);
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<{ dice: number[]; total: number } | null>(null);
  const [history, setHistory] = useState<DiceRoll[]>([]);

  useEffect(() => {
    fetchHistory();
    const channel = supabase
      .channel(`dice-${mesaId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dice_rolls", filter: `game_table_id=eq.${mesaId}` }, (payload) => {
        const row = payload.new as any;
        setHistory((prev) => [{ ...row, result_json: row.result_json as number[] }, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mesaId]);

  async function fetchHistory() {
    const { data } = await supabase
      .from("dice_rolls")
      .select("*")
      .eq("game_table_id", mesaId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setHistory(data.map((r: any) => ({ ...r, result_json: r.result_json as number[] })));
  }

  async function roll() {
    if (!user) return;
    setRolling(true);
    const dice: number[] = [];
    for (let i = 0; i < quantity; i++) {
      dice.push(Math.floor(Math.random() * diceType) + 1);
    }
    const total = dice.reduce((a, b) => a + b, 0) + modifier;
    const formula = `${quantity}d${diceType}${modifier > 0 ? ` + ${modifier}` : modifier < 0 ? ` - ${Math.abs(modifier)}` : ""}`;

    setLastResult({ dice, total });

    const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle();

    await supabase.from("dice_rolls").insert({
      game_table_id: mesaId,
      session_id: sessionId || null,
      user_id: user.id,
      user_name: profile?.name || user.email?.split("@")[0] || "Anônimo",
      roll_formula: formula,
      result_json: dice,
      total_result: total,
      modifier,
      visibility: isPrivate ? "private" : "public",
    } as any);

    setTimeout(() => setRolling(false), 600);
  }

  return (
    <div className="space-y-4">
      {/* Dice selector */}
      <div className="flex flex-wrap gap-2">
        {DICE_TYPES.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={diceType === d ? "default" : "outline"}
            onClick={() => setDiceType(d)}
            className="min-w-[48px] text-xs font-bold"
          >
            d{d}
          </Button>
        ))}
      </div>

      {/* Quantity + Modifier */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Quantidade</Label>
          <div className="flex items-center gap-1 mt-1">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-3 w-3" /></Button>
            <Input className="h-8 w-12 text-center text-sm" value={quantity} readOnly />
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQuantity(Math.min(20, quantity + 1))}><Plus className="h-3 w-3" /></Button>
          </div>
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Modificador</Label>
          <div className="flex items-center gap-1 mt-1">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setModifier(modifier - 1)}><Minus className="h-3 w-3" /></Button>
            <Input className="h-8 w-14 text-center text-sm" value={modifier >= 0 ? `+${modifier}` : modifier} readOnly />
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setModifier(modifier + 1)}><Plus className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>

      {/* Private toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isPrivate ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          Rolagem {isPrivate ? "privada (só você vê)" : "pública"}
        </div>
        <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
      </div>

      {/* Roll button */}
      <Button className="w-full gap-2" size="lg" onClick={roll} disabled={rolling}>
        <Dices className={`h-5 w-5 ${rolling ? "animate-spin" : ""}`} />
        Rolar {quantity}d{diceType}{modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : ""}
      </Button>

      {/* Last result */}
      {lastResult && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
          <div className="flex justify-center gap-2 flex-wrap">
            {lastResult.dice.map((d, i) => (
              <span key={i} className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-lg font-bold text-primary">
                {d}
              </span>
            ))}
          </div>
          {modifier !== 0 && <p className="text-xs text-muted-foreground">Modificador: {modifier > 0 ? `+${modifier}` : modifier}</p>}
          <p className="text-2xl font-bold text-foreground">Total: {lastResult.total}</p>
        </div>
      )}

      {/* History */}
      <div className="space-y-1">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Histórico</h4>
        <ScrollArea className="h-48">
          <div className="space-y-1.5">
            {history.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{r.user_name}</span>
                  <Badge variant="outline" className="text-[10px]">{r.roll_formula}</Badge>
                  {r.visibility === "private" && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                </div>
                <span className="font-bold text-primary">{r.total_result}</span>
              </div>
            ))}
            {history.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma rolagem ainda.</p>}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
