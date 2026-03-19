import { useState } from "react";
import { RadioGroup, MultiSelect } from "./PlayerQuestions";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";

type RoleOption = "player" | "gm" | "store";

interface Props {
  roles: RoleOption[];
  answers: Record<string, any>;
  setAnswers: (a: Record<string, any>) => void;
}

// ── Plan data by role ──
const PLANS: Record<RoleOption, { name: string; price: string; features: string[] }[]> = {
  player: [
    {
      name: "Passe Aventureiro",
      price: "R$ 24,90/mês",
      features: [
        "Mesas com mais aderência ao seu perfil",
        "Recomendações mais inteligentes",
        "Até 2 reservas por mês",
        "Histórico e experiência organizada",
        "Jornada mais personalizada",
      ],
    },
    {
      name: "Passe Guilda",
      price: "R$ 39,90/mês",
      features: [
        "Tudo do Passe Aventureiro",
        "Até 5 reservas por mês",
        "Experiência ampliada",
        "Mais flexibilidade para descoberta",
        "Benefícios extras na plataforma",
      ],
    },
  ],
  gm: [
    {
      name: "Mestre Pro",
      price: "R$ 29,90/mês",
      features: [
        "Perfil profissional",
        "Criação e gestão de mesas",
        "Agenda e CRM básico",
        "Analytics básicos",
        "Maior descoberta na plataforma",
        "Crescimento mais recorrente",
      ],
    },
    {
      name: "Mestre Pro+",
      price: "R$ 59,90/mês",
      features: [
        "Tudo do Mestre Pro",
        "Mais capacidade de operação",
        "Analytics completos",
        "Mais campanhas ativas",
        "Recursos avançados para escalar",
      ],
    },
  ],
  store: [
    {
      name: "Loja Base",
      price: "R$ 79,90/mês",
      features: [
        "Até 4 mesas organizadas/mês",
        "Agenda base",
        "Operação mais organizada",
        "Visibilidade da casa",
        "Analytics básicos",
      ],
    },
    {
      name: "Loja Growth",
      price: "R$ 149,90/mês",
      features: [
        "Até 12 mesas/mês",
        "Maior capacidade operacional",
        "Feed destacado",
        "Mais presença na plataforma",
        "Analytics melhores",
        "Mais recorrência",
      ],
    },
  ],
};

const VALUE_DRIVERS: Record<RoleOption, string[]> = {
  player: [
    "Encontrar mesas melhores",
    "Recomendações mais certeiras",
    "Conveniência",
    "Mais reservas",
    "Comunidade",
    "Menos tempo procurando grupo",
  ],
  gm: [
    "Lotar mesas",
    "Jogadores mais aderentes",
    "Agenda organizada",
    "CRM de jogadores",
    "Divulgação",
    "Analytics",
    "Pagamentos integrados",
    "Previsibilidade",
  ],
  store: [
    "Lotar a casa",
    "Organizar agenda",
    "Comunidade recorrente",
    "Divulgar mesas/eventos",
    "Encontrar mestres",
    "Operação mais clara",
    "Analytics",
  ],
};

const OBJECTION_OPTIONS = [
  "Preço",
  "Ainda não vejo valor suficiente",
  "Precisaria testar primeiro",
  "Depende da quantidade de usuários",
  "Depende da qualidade da comunidade",
  "Depende da facilidade de uso",
  "Outro",
];

const PRICE_RANGES: Record<RoleOption, string[]> = {
  player: ["Até R$15", "R$15–25", "R$25–40", "Acima de R$40", "Eu não pagaria"],
  gm: ["Até R$20", "R$20–40", "R$40–70", "Acima de R$70", "Eu não pagaria"],
  store: ["Até R$50", "R$50–100", "R$100–200", "Acima de R$200", "Eu não pagaria"],
};

const FAIRNESS_OPTIONS = [
  "Muito barato",
  "Justo",
  "Um pouco caro",
  "Caro demais",
  "Não entendi valor suficiente ainda",
];

const BILLING_OPTIONS = [
  "Plano mensal",
  "Trimestral com desconto",
  "Anual com desconto",
  "Usar grátis primeiro e decidir depois",
  "Pagar só se usar",
];

export function PricingPerception({ roles, answers, setAnswers }: Props) {
  const set = (key: string, val: any) => setAnswers({ ...answers, [key]: val });
  const primaryRole = roles[0] as RoleOption;
  const plans = PLANS[primaryRole] || PLANS.player;
  const drivers = VALUE_DRIVERS[primaryRole] || VALUE_DRIVERS.player;
  const priceRanges = PRICE_RANGES[primaryRole] || PRICE_RANGES.player;

  // Selected plan for detailed questions
  const [selectedPlan, setSelectedPlan] = useState<string>(plans[0]?.name || "");

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-h3 mb-2">💎 Percepção de valor</h3>
        <p className="text-body-sm text-muted-foreground">
          Queremos entender se a proposta faz sentido para você. Veja o que cada plano entrega e nos diga como se sente em relação ao valor.
        </p>
      </div>

      {/* ── Plan cards ── */}
      <div>
        <p className="field-label mb-4">Conheça os planos pensados para o seu perfil:</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <button
              key={plan.name}
              type="button"
              onClick={() => {
                setSelectedPlan(plan.name);
                set("plan_evaluated", plan.name);
              }}
              className={`relative rounded-2xl border p-5 text-left transition-all ${
                selectedPlan === plan.name
                  ? "border-primary bg-primary/5 shadow-glow-primary"
                  : "border-border bg-card hover:border-border-strong"
              }`}
            >
              {selectedPlan === plan.name && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <p className="text-label text-foreground mb-1">{plan.name}</p>
              <p className="text-xl font-bold gradient-text mb-4">{plan.price}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-caption text-muted-foreground">
                    <Check className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* ── Q1: Fairness ── */}
      <RadioGroup
        label={`Considerando o que o ${selectedPlan} entrega, como esse valor parece para você?`}
        field="price_fairness"
        answers={answers}
        set={set}
        options={FAIRNESS_OPTIONS}
      />

      {/* ── Q2: Value drivers ── */}
      <MultiSelect
        label="O que mais faria você considerar pagar por esse plano?"
        field="value_drivers"
        answers={answers}
        set={set}
        options={drivers}
      />

      {/* ── Q3: Objections ── */}
      <MultiSelect
        label="O que mais te faria hesitar em pagar?"
        field="objections"
        answers={answers}
        set={set}
        options={OBJECTION_OPTIONS}
      />

      {/* ── Q4: Price range ── */}
      <RadioGroup
        label="Qual faixa de valor faria mais sentido para você?"
        field="ideal_price_range"
        answers={answers}
        set={set}
        options={priceRanges}
      />

      {/* ── Q5: Billing cycle ── */}
      <RadioGroup
        label="Você preferiria..."
        field="preferred_billing"
        answers={answers}
        set={set}
        options={BILLING_OPTIONS}
      />

      {/* ── Q6: Most valued features ── */}
      <MultiSelect
        label="Para você, quais dessas entregas têm mais valor?"
        field="most_valued_features"
        answers={answers}
        set={set}
        options={plans.flatMap((p) => p.features).filter((v, i, a) => a.indexOf(v) === i)}
      />

      {/* ── Optional comment ── */}
      <div>
        <p className="field-label mb-2">Quer deixar algum comentário sobre o que viu? (opcional)</p>
        <Textarea
          value={answers.pricing_comment || ""}
          onChange={(e) => set("pricing_comment", e.target.value)}
          rows={3}
          placeholder="O que precisaria estar presente para isso valer a pena no seu caso?"
          className="resize-none"
        />
      </div>
    </div>
  );
}
