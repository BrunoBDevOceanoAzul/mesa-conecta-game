import { Textarea } from "@/components/ui/textarea";

interface Props {
  answers: Record<string, any>;
  setAnswers: (a: Record<string, any>) => void;
}

export function PlayerQuestions({ answers, setAnswers }: Props) {
  const set = (key: string, val: any) => setAnswers({ ...answers, [key]: val });

  return (
    <div className="space-y-6">
      <h3 className="text-h3">🎲 Perguntas para Jogadores</h3>

      <RadioGroup label="Você joga com que frequência?" field="frequency" answers={answers} set={set}
        options={["Toda semana", "A cada 15 dias", "1x por mês", "Esporadicamente", "Ainda não jogo mas quero"]} />

      <MultiSelect label="Quais sistemas/universos mais te interessam?" field="systems" answers={answers} set={set}
        options={["D&D 5e", "Pathfinder", "Call of Cthulhu", "Vampire: The Masquerade", "Tormenta 20", "Savage Worlds", "GURPS", "Old Dragon", "Ordem Paranormal", "Board Games", "Outros"]} />

      <RadioGroup label="Você prefere que tipo de mesa?" field="session_type" answers={answers} set={set}
        options={["One-shot", "Campanha", "Evento", "Tanto faz"]} />

      <RadioGroup label="Formato preferido?" field="play_format" answers={answers} set={set}
        options={["Online", "Presencial", "Híbrido"]} />

      <RadioGroup label="Qual faixa de preço faz sentido por sessão?" field="price_per_session" answers={answers} set={set}
        options={["Até R$20", "R$20–40", "R$40–70", "Mais de R$70", "Só jogo de graça"]} />

      <MultiSelect label="Em quais dias você costuma jogar?" field="available_days" answers={answers} set={set}
        options={["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]} />

      <RadioGroup label="Seu nível de experiência?" field="experience" answers={answers} set={set}
        options={["Nunca joguei", "Iniciante", "Intermediário", "Experiente", "Veterano"]} />

      <MultiSelect label="O que mais te atrai em uma mesa?" field="attractions" answers={answers} set={set}
        options={["Narrativa", "Estratégia", "Social", "Horror", "Fantasia", "Investigação", "Casual", "Competitivo"]} />

      <TextArea label="O que mais te frustra para encontrar uma boa mesa?" field="frustrations" answers={answers} set={set} />

      <RadioGroup label="Teria interesse em assinar uma plataforma que te ajudasse a encontrar mesas certas?" field="subscription_interest" answers={answers} set={set}
        options={["sim", "talvez", "não"]} />

      <RadioGroup label="Quanto faria sentido pagar por mês?" field="price_range" answers={answers} set={set}
        options={["até R$15", "R$15–25", "R$25–40", "mais de R$40", "não pagaria"]} />
    </div>
  );
}

// Shared sub-components
function RadioGroup({ label, field, options, answers, set }: {
  label: string; field: string; options: string[];
  answers: Record<string, any>; set: (k: string, v: any) => void;
}) {
  return (
    <div>
      <p className="field-label mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => set(field, opt)}
            className={`rounded-lg border px-3 py-2 text-sm transition-all ${
              answers[field] === opt
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelect({ label, field, options, answers, set }: {
  label: string; field: string; options: string[];
  answers: Record<string, any>; set: (k: string, v: any) => void;
}) {
  const selected: string[] = answers[field] || [];
  const toggle = (opt: string) => {
    set(field, selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  };
  return (
    <div>
      <p className="field-label mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-lg border px-3 py-2 text-sm transition-all ${
              selected.includes(opt)
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextArea({ label, field, answers, set }: {
  label: string; field: string;
  answers: Record<string, any>; set: (k: string, v: any) => void;
}) {
  return (
    <div>
      <p className="field-label mb-2">{label}</p>
      <Textarea
        value={answers[field] || ""}
        onChange={(e) => set(field, e.target.value)}
        rows={3}
        placeholder="Escreva livremente..."
        className="resize-none"
      />
    </div>
  );
}

export { RadioGroup, MultiSelect, TextArea };
