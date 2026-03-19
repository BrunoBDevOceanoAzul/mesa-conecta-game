import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlayerQuestions } from "./steps/PlayerQuestions";
import { GMQuestions } from "./steps/GMQuestions";
import { StoreQuestions } from "./steps/StoreQuestions";
import { CommonQuestions } from "./steps/CommonQuestions";
import { PricingPerception } from "./steps/PricingPerception";

type RoleOption = "player" | "gm" | "store";

interface Props {
  utm: { source: string; medium: string; campaign: string };
  onSuccess: () => void;
}

export function InterestForm({ utm, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0 — identity
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [instagram, setInstagram] = useState("");

  // Step 1 — role
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Per-role answers
  const [playerAnswers, setPlayerAnswers] = useState<Record<string, any>>({});
  const [gmAnswers, setGmAnswers] = useState<Record<string, any>>({});
  const [storeAnswers, setStoreAnswers] = useState<Record<string, any>>({});
  const [commonAnswers, setCommonAnswers] = useState<Record<string, any>>({});
  const [pricingAnswers, setPricingAnswers] = useState<Record<string, any>>({});

  const toggleRole = (r: RoleOption) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  // Build dynamic step list
  const getSteps = () => {
    const steps = ["identity", "role"];
    if (roles.includes("player")) steps.push("player");
    if (roles.includes("gm")) steps.push("gm");
    if (roles.includes("store")) steps.push("store");
    steps.push("pricing");
    steps.push("common");
    return steps;
  };

  const steps = getSteps();
  const totalSteps = steps.length;
  const currentStepName = steps[step] || "identity";
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const canAdvance = () => {
    if (currentStepName === "identity") return name.trim() && email.trim() && email.includes("@");
    if (currentStepName === "role") return roles.length > 0;
    return true;
  };

  const computeScores = () => {
    let score = 0;
    let pricingSensitivity = "";
    let willingnessToPay = "";
    let earlyAdopter = "";
    let highIntent = false;
    let likelyPaid = false;
    let likelyFounder = false;

    // Player scoring
    if (roles.includes("player")) {
      const sub = playerAnswers.subscription_interest;
      if (sub === "sim") { score += 30; highIntent = true; }
      else if (sub === "talvez") score += 15;
      const price = playerAnswers.price_range;
      if (price && price !== "não pagaria") { likelyPaid = true; score += 10; }
      if (price === "não pagaria") pricingSensitivity = "high";
      else if (price === "até R$15") pricingSensitivity = "medium";
      else pricingSensitivity = "low";
      willingnessToPay = price || "";
    }

    // GM scoring
    if (roles.includes("gm")) {
      const interest = gmAnswers.platform_interest;
      if (interest === "sim") { score += 30; highIntent = true; }
      else if (interest === "talvez") score += 15;
      const earlyA = gmAnswers.early_adopter;
      if (earlyA === "sim") { likelyFounder = true; score += 20; }
      else if (earlyA === "talvez") score += 10;
      earlyAdopter = earlyA || "";
      const price = gmAnswers.price_range;
      if (price && price !== "não pagaria") { likelyPaid = true; score += 10; }
      if (!pricingSensitivity) {
        if (price === "não pagaria") pricingSensitivity = "high";
        else if (price === "até R$20") pricingSensitivity = "medium";
        else pricingSensitivity = "low";
      }
      if (!willingnessToPay) willingnessToPay = price || "";
    }

    // Store scoring
    if (roles.includes("store")) {
      const interest = storeAnswers.platform_interest;
      if (interest === "sim") { score += 30; highIntent = true; }
      else if (interest === "talvez") score += 15;
      const partner = storeAnswers.early_partner;
      if (partner === "sim") { likelyFounder = true; score += 20; }
      else if (partner === "talvez") score += 10;
      if (!earlyAdopter) earlyAdopter = partner || "";
      const price = storeAnswers.price_range;
      if (price && price !== "não pagaria") { likelyPaid = true; score += 15; }
    }

    // Pricing perception boost
    const fairness = pricingAnswers.price_fairness;
    if (fairness === "Justo" || fairness === "Muito barato") { score += 15; likelyPaid = true; }
    else if (fairness === "Um pouco caro") score += 5;

    const idealRange = pricingAnswers.ideal_price_range;
    if (idealRange && !idealRange.toLowerCase().includes("não pagaria")) score += 5;

    // Common
    const followup = commonAnswers.followup_conversation;
    if (followup === "sim") score += 10;
    const updates = commonAnswers.wants_updates;
    if (updates === "sim") score += 5;

    // Cluster
    let cluster = "curioso";
    if (score >= 60) cluster = "early_adopter_forte";
    else if (score >= 40) cluster = "alto_interesse";
    else if (score >= 20) cluster = "interesse_moderado";

    return {
      interest_score: score,
      pricing_sensitivity: pricingSensitivity,
      willingness_to_pay: willingnessToPay,
      early_adopter_interest: earlyAdopter,
      wants_followup: followup === "sim" || followup === "talvez",
      high_intent_lead: highIntent,
      likely_paid_user: likelyPaid,
      likely_founder: likelyFounder,
      cluster_label: cluster,
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const scores = computeScores();

      const wantsTrial = pricingAnswers.preferred_billing === "Usar grátis primeiro e decidir depois";

      const { data: leadData, error } = await supabase.from("interest_leads").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        instagram: instagram.trim() || null,
        selected_roles_json: roles,
        primary_role: roles[0],
        player_answers_json: roles.includes("player") ? playerAnswers : {},
        gm_answers_json: roles.includes("gm") ? gmAnswers : {},
        store_answers_json: roles.includes("store") ? storeAnswers : {},
        common_answers_json: commonAnswers,
        utm_source: utm.source || null,
        utm_medium: utm.medium || null,
        utm_campaign: utm.campaign || null,
        pricing_feedback_json: pricingAnswers,
        price_fairness_label: pricingAnswers.price_fairness || null,
        preferred_billing_cycle: pricingAnswers.preferred_billing || null,
        plan_objections_json: pricingAnswers.objections || [],
        value_drivers_json: pricingAnswers.value_drivers || [],
        wants_trial: wantsTrial,
        ...scores,
      } as any).select("id").single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Esse e-mail já foi registrado. Obrigado por seu interesse!");
        } else {
          throw error;
        }
        return;
      }

      // Save detailed pricing feedback per role
      if (leadData?.id && pricingAnswers.price_fairness) {
        const feedbackRows = roles.map((role) => ({
          lead_id: leadData.id,
          role_context: role,
          plan_presented: pricingAnswers.plan_evaluated || "",
          perceived_price_position: pricingAnswers.price_fairness || null,
          willingness_to_pay_range: pricingAnswers.ideal_price_range || null,
          preferred_billing_cycle: pricingAnswers.preferred_billing || null,
          main_value_drivers: pricingAnswers.value_drivers || [],
          main_objections: pricingAnswers.objections || [],
          comment: pricingAnswers.pricing_comment || null,
        }));
        await supabase.from("interest_pricing_feedback").insert(feedbackRows as any);
      }

      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao enviar. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step === totalSteps - 1) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="surface-card-elevated p-6 md:p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-caption mb-2">
          <span>Etapa {step + 1} de {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--gradient-primary)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepName}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {currentStepName === "identity" && (
            <div className="space-y-5">
              <h3 className="text-h3 mb-2">Quem é você?</h3>
              <p className="text-body-sm text-muted-foreground mb-4">Informações básicas para te conhecermos melhor.</p>

              <Field label="Nome *" value={name} onChange={setName} placeholder="Seu nome" />
              <Field label="E-mail *" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
              <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="(11) 99999-9999" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Cidade" value={city} onChange={setCity} placeholder="São Paulo" />
                <Field label="Estado" value={state} onChange={setState} placeholder="SP" />
              </div>
              <Field label="Instagram (opcional)" value={instagram} onChange={setInstagram} placeholder="@seuuser" />
            </div>
          )}

          {currentStepName === "role" && (
            <div>
              <h3 className="text-h3 mb-2">Como você se identifica?</h3>
              <p className="text-body-sm text-muted-foreground mb-6">Selecione um ou mais perfis.</p>
              <div className="grid gap-3">
                {([
                  { value: "player" as RoleOption, label: "🎲 Jogador", desc: "Jogo RPG, board games ou quero começar" },
                  { value: "gm" as RoleOption, label: "👑 Mestre", desc: "Mestro ou quero mestrar mesas" },
                  { value: "store" as RoleOption, label: "🏪 Loja / Luderia", desc: "Tenho ou trabalho em uma loja/luderia" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleRole(opt.value)}
                    className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                      roles.includes(opt.value)
                        ? "border-primary bg-primary/8 shadow-glow-primary"
                        : "border-border bg-card hover:border-border-strong"
                    }`}
                  >
                    <span className="text-2xl">{opt.label.split(" ")[0]}</span>
                    <div>
                      <p className="text-label text-foreground">{opt.label.split(" ").slice(1).join(" ")}</p>
                      <p className="text-caption mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStepName === "player" && (
            <PlayerQuestions answers={playerAnswers} setAnswers={setPlayerAnswers} />
          )}

          {currentStepName === "gm" && (
            <GMQuestions answers={gmAnswers} setAnswers={setGmAnswers} />
          )}

          {currentStepName === "store" && (
            <StoreQuestions answers={storeAnswers} setAnswers={setStoreAnswers} />
          )}

          {currentStepName === "pricing" && (
            <PricingPerception roles={roles} answers={pricingAnswers} setAnswers={setPricingAnswers} />
          )}

          {currentStepName === "common" && (
            <CommonQuestions answers={commonAnswers} setAnswers={setCommonAnswers} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={next}
          disabled={!canAdvance() || loading}
          className="cta-glow"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {step === totalSteps - 1 ? "Enviar respostas" : "Continuar"}
          {step < totalSteps - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5"
      />
    </div>
  );
}
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5"
      />
    </div>
  );
}
