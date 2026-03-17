import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PLAY_STYLES } from "@/data/mock";
import { RPG_SYSTEMS, POPULAR_SYSTEMS } from "@/data/rpg-systems";
import { SearchableSystemSelect } from "@/components/shared/SearchableSystemSelect";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface StepConfig {
  title: string;
  subtitle: string;
  type: "text" | "select-multi" | "select-one" | "systems-search" | "city-autocomplete";
  options?: string[];
  field: string;
}

const playerSteps: StepConfig[] = [
  { title: "Qual sua cidade?", subtitle: "Para encontrar mesas perto de você", type: "city-autocomplete", field: "city" },
  { title: "Sistemas preferidos", subtitle: "Busque entre 600+ sistemas de RPG", type: "systems-search", field: "systems" },
  { title: "Estilos de mesa", subtitle: "Como você gosta de jogar?", type: "select-multi", options: PLAY_STYLES, field: "styles" },
  { title: "Nível de experiência", subtitle: "Não existe resposta errada", type: "select-one", options: ["Nunca joguei", "Iniciante", "Intermediário", "Experiente", "Veterano"], field: "experience" },
  { title: "Formato preferido", subtitle: "Como você prefere jogar?", type: "select-one", options: ["Presencial", "Online", "Híbrido", "Tanto faz"], field: "format" },
  { title: "Faixa de investimento", subtitle: "Quanto investe por sessão?", type: "select-one", options: ["Até R$20", "R$20–40", "R$40–60", "R$60+", "Flexível"], field: "budget" },
];

const gmSteps: StepConfig[] = [
  { title: "Qual sua cidade?", subtitle: "Onde você narra?", type: "city-autocomplete", field: "city" },
  { title: "Sistemas que domina", subtitle: "Busque entre 600+ sistemas de RPG", type: "systems-search", field: "systems" },
  { title: "Estilo narrativo", subtitle: "Como você conduz?", type: "select-multi", options: PLAY_STYLES, field: "styles" },
  { title: "Foco em quem?", subtitle: "Seu público principal", type: "select-one", options: ["Iniciantes", "Intermediários", "Avançados", "Todos os níveis"], field: "focus" },
  { title: "Formato das sessões", subtitle: "Como você narra?", type: "select-one", options: ["Presencial", "Online", "Híbrido"], field: "format" },
  { title: "Ticket médio", subtitle: "Quanto cobra em média?", type: "select-one", options: ["Até R$25", "R$25–40", "R$40–60", "R$60–100", "R$100+"], field: "ticket" },
];

const storeSteps: StepConfig[] = [
  { title: "Cidade da luderia", subtitle: "Localização do espaço", type: "city-autocomplete", field: "city" },
  { title: "Sistemas disponíveis", subtitle: "Quais vocês oferecem?", type: "systems-search", field: "systems" },
  { title: "Capacidade", subtitle: "Quantas pessoas cabem?", type: "select-one", options: ["Até 15", "15–30", "30–50", "50+"], field: "capacity" },
  { title: "Mesas simultâneas", subtitle: "Quantas ao mesmo tempo?", type: "select-one", options: ["1–3", "4–6", "7–10", "10+"], field: "tables" },
  { title: "Dias disponíveis", subtitle: "Quando funciona?", type: "select-multi", options: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"], field: "days" },
  { title: "Público", subtitle: "Quem frequenta?", type: "select-multi", options: ["Famílias", "Jovens (18-25)", "Adultos (25-40)", "Gamers", "Corporativo", "Iniciantes"], field: "audience" },
];

const stepsMap: Record<string, StepConfig[]> = {
  jogador: playerSteps,
  mestre: gmSteps,
  loja: storeSteps,
};

export default function Onboarding() {
  const { role = "jogador" } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const steps = stepsMap[role] || playerSteps;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);

  const step = steps[current];
  const value = answers[step.field];

  const toggleMulti = (opt: string) => {
    const arr = (value as string[]) || [];
    setAnswers({ ...answers, [step.field]: arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt] });
  };

  const canNext =
    step.type === "text" || step.type === "city-autocomplete"
      ? !!(value as string)?.trim()
      : step.type === "select-one"
      ? !!value
      : ((value as string[]) || []).length > 0;

  const goNext = () => { setDirection(1); setCurrent(current + 1); };
  const goPrev = () => { setDirection(-1); current > 0 ? setCurrent(current - 1) : navigate(-1); };

  const finish = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        city: answers.city as string,
        lat: coords.lat,
        lng: coords.lng,
      };

      if (answers.systems) updateData.preferred_systems = answers.systems;
      if (answers.styles) updateData.play_styles = answers.styles;
      if (answers.experience) updateData.experience_level = answers.experience;
      if (answers.format) updateData.preferred_format = answers.format;
      if (answers.budget) updateData.budget_range = answers.budget;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      const dashMap: Record<string, string> = {
        jogador: "/dashboard/jogador",
        mestre: "/dashboard/mestre",
        loja: "/dashboard/loja",
      };
      navigate(dashMap[role] || "/dashboard/jogador");
    } catch (err: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: "Tente novamente. Se persistir, entre em contato.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = ((current + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-medium">
            <span>Passo {current + 1} de {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, backgroundImage: "var(--gradient-primary)" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-display font-bold text-foreground">{step.title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground mb-7">{step.subtitle}</p>

            {step.type === "text" && (
              <input
                type="text"
                value={(value as string) || ""}
                onChange={(e) => setAnswers({ ...answers, [step.field]: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                placeholder="Digite aqui..."
                autoFocus
              />
            )}

            {step.type === "city-autocomplete" && (
              <CityAutocomplete
                value={(value as string) || ""}
                onChange={(city, lat, lng) => {
                  setAnswers({ ...answers, [step.field]: city });
                  if (lat && lng) setCoords({ lat, lng });
                }}
                placeholder="Buscar cidade..."
              />
            )}
            {step.type === "systems-search" && (
              <SearchableSystemSelect
                systems={RPG_SYSTEMS}
                popularSystems={POPULAR_SYSTEMS}
                selected={(value as string[]) || []}
                onChange={(sel) => setAnswers({ ...answers, [step.field]: sel })}
                placeholder="Buscar entre 600+ sistemas..."
              />
            )}

            {step.type === "select-one" && (
              <div className="grid gap-2">
                {step.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [step.field]: opt })}
                    className={`flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-all ${
                      value === opt ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${value === opt ? "border-primary bg-primary" : "border-muted"}`}>
                      {value === opt && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {step.type === "select-multi" && (
              <div className="flex flex-wrap gap-2">
                {step.options?.map((opt) => {
                  const selected = ((value as string[]) || []).includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleMulti(opt)}
                      className={`rounded-lg border px-4 py-2.5 text-sm transition-all ${
                        selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/20"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex justify-between">
          <Button variant="ghost" onClick={goPrev} disabled={current === 0} className="text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          {current < steps.length - 1 ? (
            <Button variant="default" onClick={goNext} disabled={!canNext}>
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={finish} disabled={!canNext || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
