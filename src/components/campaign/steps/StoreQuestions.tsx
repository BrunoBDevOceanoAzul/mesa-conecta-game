import { RadioGroup, MultiSelect, TextArea } from "./PlayerQuestions";
import { Input } from "@/components/ui/input";

interface Props {
  answers: Record<string, any>;
  setAnswers: (a: Record<string, any>) => void;
}

export function StoreQuestions({ answers, setAnswers }: Props) {
  const set = (key: string, val: any) => setAnswers({ ...answers, [key]: val });

  return (
    <div className="space-y-6">
      <h3 className="text-h3">🏪 Perguntas para Lojas & Luderias</h3>

      <div>
        <p className="field-label mb-2">Nome da loja</p>
        <Input value={answers.store_name || ""} onChange={(e) => set("store_name", e.target.value)} placeholder="Nome do estabelecimento" />
      </div>

      <div>
        <p className="field-label mb-2">Cidade da loja</p>
        <Input value={answers.store_city || ""} onChange={(e) => set("store_city", e.target.value)} placeholder="Cidade" />
      </div>

      <RadioGroup label="Vocês já organizam eventos ou mesas?" field="organizes_events" answers={answers} set={set}
        options={["Sim, frequentemente", "Sim, às vezes", "Não, mas queremos", "Não"]} />

      <RadioGroup label="Quantas mesas simultâneas conseguem operar?" field="simultaneous_tables" answers={answers} set={set}
        options={["1–2", "3–5", "6–10", "Mais de 10"]} />

      <RadioGroup label="Principal modelo de negócio da casa?" field="business_model" answers={answers} set={set}
        options={["Venda de produtos", "Locação de mesas", "Eventos/sessões", "Alimentação", "Misto"]} />

      <MultiSelect label="Quais tipos de evento funcionam melhor?" field="best_events" answers={answers} set={set}
        options={["RPG semanal", "Board game nights", "Torneios", "One-shots temáticos", "Eventos especiais", "Workshops"]} />

      <MultiSelect label="Maiores desafios hoje?" field="challenges" answers={answers} set={set}
        options={["Lotação", "Agenda", "Divulgação", "Recorrência", "Parceria com mestres", "Operação"]} />

      <RadioGroup label="Gostaria de uma plataforma para organizar agenda, comunidade e ocupação?" field="platform_interest" answers={answers} set={set}
        options={["sim", "talvez", "não"]} />

      <RadioGroup label="Quanto faria sentido pagar por mês?" field="price_range" answers={answers} set={set}
        options={["até R$50", "R$50–100", "R$100–200", "mais de R$200", "não pagaria"]} />

      <RadioGroup label="Teriam interesse em entrar cedo como parceiros da HIVIUM?" field="early_partner" answers={answers} set={set}
        options={["sim", "talvez", "não"]} />
    </div>
  );
}
