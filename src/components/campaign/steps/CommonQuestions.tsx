import { RadioGroup, TextArea } from "./PlayerQuestions";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  answers: Record<string, any>;
  setAnswers: (a: Record<string, any>) => void;
}

export function CommonQuestions({ answers, setAnswers }: Props) {
  const set = (key: string, val: any) => setAnswers({ ...answers, [key]: val });

  return (
    <div className="space-y-6">
      <h3 className="text-h3">✨ Perguntas finais</h3>
      <p className="text-body-sm text-muted-foreground">Quase lá! Só mais algumas perguntas para todos.</p>

      <TextArea label="O que mais te chama atenção nessa ideia?" field="attention_hook" answers={answers} set={set} />

      <TextArea label="O que faria você usar a HIVIUM de verdade?" field="real_usage_trigger" answers={answers} set={set} />

      <TextArea label="O que não pode faltar em uma plataforma assim?" field="must_have" answers={answers} set={set} />

      <RadioGroup label="Gostaria de receber novidades e convite prioritário?" field="wants_updates" answers={answers} set={set}
        options={["sim", "não"]} />

      <RadioGroup label="Topa participar de uma conversa rápida de validação?" field="followup_conversation" answers={answers} set={set}
        options={["sim", "talvez", "não"]} />
    </div>
  );
}
