import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PLAY_STYLES } from "@/data/mock";
import { RPG_SYSTEMS, POPULAR_SYSTEMS } from "@/data/rpg-systems";
import { SearchableSystemSelect } from "@/components/shared/SearchableSystemSelect";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

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
  { title: "Ticket médio por sessão", subtitle: "Quanto cobra em média?", type: "select-one", options: ["Até R$25", "R$25–40", "R$40–60", "R$60–100", "R$100+"], field: "ticket" },
];

const storeSteps: StepConfig[] = [
  { title: "Qual a cidade da luderia?", subtitle: "Localização do espaço", type: "city-autocomplete", field: "city" },
  { title: "Sistemas e jogos disponíveis", subtitle: "Quais sistemas vocês oferecem?", type: "systems-search", field: "systems" },
  { title: "Capacidade da casa", subtitle: "Quantas pessoas cabem?", type: "select-one", options: ["Até 15", "15–30", "30–50", "50+"], field: "capacity" },
  { title: "Mesas simultâneas", subtitle: "Quantas mesas cabem ao mesmo tempo?", type: "select-one", options: ["1–3", "4–6", "7–10", "10+"], field: "tables" },
  { title: "Dias disponíveis", subtitle: "Quando a luderia funciona?", type: "select-multi", options: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"], field: "days" },
  { title: "Público alvo", subtitle: "Quem frequenta?", type: "select-multi", options: ["Famílias", "Jovens (18-25)", "Adultos (25-40)", "Gamers", "Corporativo", "Iniciantes"], field: "audience" },
];

const stepsMap: Record<string, StepConfig[]> = {
  jogador: playerSteps,
  mestre: gmSteps,
  loja: storeSteps,
};

export default function Onboarding() {
  const { role = "jogador" } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const steps = stepsMap[role] || playerSteps;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

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

  const finish = () => {
    const dashMap: Record<string, string> = { jogador: "/dashboard/jogador", mestre: "/dashboard/mestre", loja: "/dashboard/loja" };
    navigate(dashMap[role] || "/dashboard/jogador");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Passo {current + 1} de {steps.length}</span>
            <span>{Math.round(((current + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((current + 1) / steps.length) * 100}%`, backgroundImage: "linear-gradient(135deg, hsl(258 90% 66%), hsl(189 94% 43%))" }} />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-foreground">{step.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground mb-6">{step.subtitle}</p>

        {step.type === "text" && (
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => setAnswers({ ...answers, [step.field]: e.target.value })}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  value === opt ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${value === opt ? "border-primary bg-primary" : "border-muted"}`}>
                  {value === opt && <Check className="h-3 w-3 text-primary-foreground" />}
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
                    selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => current > 0 ? setCurrent(current - 1) : navigate(-1)} disabled={current === 0}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          {current < steps.length - 1 ? (
            <Button variant="hero" onClick={() => setCurrent(current + 1)} disabled={!canNext}>
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={finish} disabled={!canNext}>
              Finalizar 🎉
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
