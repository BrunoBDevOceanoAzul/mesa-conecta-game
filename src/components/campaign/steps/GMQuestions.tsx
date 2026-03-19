import { RadioGroup, MultiSelect, TextArea } from "./PlayerQuestions";
import { Input } from "@/components/ui/input";

interface Props {
  answers: Record<string, any>;
  setAnswers: (a: Record<string, any>) => void;
}

export function GMQuestions({ answers, setAnswers }: Props) {
  const set = (key: string, val: any) => setAnswers({ ...answers, [key]: val });

  return (
    <div className="space-y-6">
      <h3 className="text-h3">👑 Perguntas para Mestres</h3>

      <RadioGroup label="Há quanto tempo você mestra?" field="experience_time" answers={answers} set={set}
        options={["Menos de 1 ano", "1–3 anos", "3–5 anos", "Mais de 5 anos"]} />

      <MultiSelect label="Quais sistemas você domina?" field="systems_mastered" answers={answers} set={set}
        options={["D&D 5e", "Pathfinder", "Call of Cthulhu", "Vampire", "Tormenta 20", "Savage Worlds", "GURPS", "Old Dragon", "Ordem Paranormal", "Outros"]} />

      <RadioGroup label="Qual estilo de mesa mais te representa?" field="play_style" answers={answers} set={set}
        options={["Narrativo/Roleplay", "Tático/Combate", "Sandbox", "Mistério/Investigação", "Horror", "Misto"]} />

      <RadioGroup label="Você já cobra por sessão?" field="charges" answers={answers} set={set}
        options={["sim", "às vezes", "não"]} />

      {(answers.charges === "sim" || answers.charges === "às vezes") && (
        <div>
          <p className="field-label mb-2">Qual faixa por jogador/sessão?</p>
          <Input
            value={answers.charge_range || ""}
            onChange={(e) => set("charge_range", e.target.value)}
            placeholder="Ex: R$30–50"
          />
        </div>
      )}

      <RadioGroup label="Gostaria de lotar mais mesas com previsibilidade?" field="wants_predictability" answers={answers} set={set}
        options={["sim", "talvez", "não"]} />

      <MultiSelect label="Qual seu maior desafio hoje?" field="challenges" answers={answers} set={set}
        options={["Encontrar jogadores certos", "Recorrência", "Agenda", "Cobrança", "Divulgação", "Organização"]} />

      <MultiSelect label="Que tipo de suporte faria mais diferença?" field="desired_support" answers={answers} set={set}
        options={["Agenda", "CRM", "Descoberta de jogadores", "Pagamentos", "Divulgação", "Analytics"]} />

      <RadioGroup label="Teria interesse em uma plataforma para operar suas mesas?" field="platform_interest" answers={answers} set={set}
        options={["sim", "talvez", "não"]} />

      <RadioGroup label="Quanto faria sentido pagar por mês?" field="price_range" answers={answers} set={set}
        options={["até R$20", "R$20–40", "R$40–70", "mais de R$70", "não pagaria"]} />

      <RadioGroup label="Toparia participar como early adopter/founder?" field="early_adopter" answers={answers} set={set}
        options={["sim", "talvez", "não"]} />
    </div>
  );
}
