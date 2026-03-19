import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { stepsMap, type RoleKey } from "@/lib/onboarding-steps";
import { generateBadges } from "@/lib/badge-generator";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { ProfileSelect } from "@/components/onboarding/ProfileSelect";
import { OnboardingStepView } from "@/components/onboarding/OnboardingStep";
import { ReviewScreen } from "@/components/onboarding/ReviewScreen";
import { ProfileMappedScreen } from "@/components/onboarding/ProfileMappedScreen";
import { TransitionScreen } from "@/components/onboarding/TransitionScreen";

type Phase =
  | "welcome"
  | "profile"
  | "transition-start"
  | "steps"
  | "transition-review"
  | "review"
  | "transition-mapped"
  | "mapped";

export default function Onboarding() {
  const { role: paramRole } = useParams<{ role?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>(paramRole ? "steps" : "welcome");
  const [role, setRole] = useState<RoleKey | null>(paramRole ? (paramRole as RoleKey) : null);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [availability, setAvailability] = useState<{ days: string[]; times: string[] }>({ days: [], times: [] });
  const [avoidedNotes, setAvoidedNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load existing profile data on mount
  useEffect(() => {
    if (!user) {
      setProfileLoaded(true);
      return;
    }
    const load = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (data) {
          const loaded: Record<string, unknown> = {};
          if (data.city) loaded.city = data.city;
          if (data.preferred_systems?.length) loaded.preferred_systems = data.preferred_systems;
          if (data.play_styles?.length) loaded.play_styles = data.play_styles;
          if (data.experience_level) loaded.experience_level = data.experience_level;
          if (data.preferred_format) loaded.preferred_format = data.preferred_format;
          if (data.budget_range) loaded.budget_range = data.budget_range;
          if (data.lat && data.lng) setCoords({ lat: data.lat, lng: data.lng });
          if (Object.keys(loaded).length > 0) setAnswers(loaded);
          if (data.role) {
            setRole(data.role as RoleKey);
          } else {
            // No role selected yet — ensure we show profile selection
            setPhase("profile");
          }
          const step = (data as any).onboarding_step;
          if (typeof step === "number" && step > 0 && data.role) setCurrent(step);
        }
      } catch {
        // Silent
      } finally {
        setProfileLoaded(true);
      }
    };
    load();
  }, [user]);

  const effectiveRole: RoleKey = role || "jogador";
  const allSteps = stepsMap[effectiveRole];
  // Filter steps based on conditional logic (e.g., skip city for online-only users)
  const steps = allSteps.filter((s) => {
    if (!s.conditionalOn) return true;
    const depValue = answers[s.conditionalOn.field];
    return s.conditionalOn.values.includes(depValue as string);
  });

  const handleChange = useCallback((field: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectRole = (r: RoleKey) => {
    setRole(r);
    setCurrent(0);
    setPhase("transition-start");
  };

  const goNext = () => {
    setDirection(1);
    saveProgress(current + 1);
    setCurrent((c) => c + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    if (current === 0) {
      setPhase("profile");
    } else {
      setCurrent((c) => c - 1);
    }
  };

  const goToReview = () => {
    setPhase("transition-review");
  };

  const goToStep = (idx: number) => {
    setCurrent(idx);
    setPhase("steps");
  };

  const saveProgress = async (stepNum: number) => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_step: stepNum, role: effectiveRole } as any)
        .eq("user_id", user.id);
    } catch {
      // Silent
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const badges = generateBadges(effectiveRole, {
        ...answers,
        availability_days: availability.days,
        availability_times: availability.times,
      });
      const badgeLabels = badges.map((b) => b.label);

      const profileData: Record<string, unknown> = {
        role: effectiveRole,
        city: answers.city || null,
        lat: coords.lat || null,
        lng: coords.lng || null,
        preferred_systems: answers.preferred_systems || [],
        play_styles: answers.play_styles || [],
        experience_level: answers.experience_level || null,
        preferred_format: answers.preferred_format || null,
        budget_range: answers.budget_range || null,
        session_format_pref: answers.session_format_pref || null,
        availability_days: availability.days,
        availability_times: availability.times,
        themes_liked: answers.themes_liked || [],
        themes_avoided: answers.themes_avoided || [],
        avoided_notes: avoidedNotes || null,
        narrative_styles: answers.narrative_styles || [],
        years_mastering: answers.years_mastering || null,
        max_players: answers.max_players || null,
        target_audience: answers.target_audience || null,
        mesa_formats: answers.mesa_formats || [],
        special_services: answers.special_services || [],
        brand_category: answers.brand_category || null,
        brand_objective: answers.brand_objective || null,
        brand_audience: answers.brand_audience || [],
        brand_budget: answers.brand_budget || null,
        badges: badgeLabels,
        onboarding_completed: true,
        onboarding_step: steps.length,
      };

      const { error } = await supabase
        .from("profiles")
        .update(profileData as any)
        .eq("user_id", user.id);

      if (error) throw error;

      if (effectiveRole === "loja") {
        const storeData: Record<string, unknown> = {
          owner_id: user.id,
          name: (answers.city as string) || "Minha Luderia",
          city: answers.city || null,
          lat: coords.lat || null,
          lng: coords.lng || null,
          capacity: answers.capacity || null,
          simultaneous_tables: answers.simultaneous_tables || null,
          opening_days: availability.days,
          ticket_avg: answers.ticket_avg || null,
          amenities: answers.amenities || [],
          game_catalog: answers.game_catalog || [],
        };

        const { data: existing } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (existing) {
          await supabase.from("stores").update(storeData as any).eq("id", existing.id);
        } else {
          await supabase.from("stores").insert(storeData as any);
        }
      }

      setPhase("transition-mapped");
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

  const handleContinueToDashboard = () => {
    const dashMap: Record<RoleKey, string> = {
      jogador: "/dashboard/jogador",
      mestre: "/dashboard/mestre",
      loja: "/dashboard/loja",
      marca: "/boost",
    };
    navigate(dashMap[effectiveRole] || "/dashboard/jogador");
  };

  const step = steps[current];

  // Show loading while auth or profile is loading
  if (authLoading || !profileLoaded) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "welcome" && (
          <WelcomeScreen key="welcome" onStart={() => setPhase("profile")} />
        )}

        {phase === "profile" && (
          <ProfileSelect key="profile" onSelect={handleSelectRole} />
        )}

        {phase === "transition-start" && (
          <TransitionScreen
            key="transition-start"
            headline="Vamos calibrar seu perfil"
            subtext="Em poucos passos, a HIVIUM personaliza mesas online, presenciais e híbridas ao seu ritmo."
            onComplete={() => setPhase("steps")}
            duration={2400}
          />
        )}

        {phase === "steps" && step && (
          <OnboardingStepView
            key={`step-${step.id}`}
            step={step}
            value={answers[step.field]}
            onChange={handleChange}
            onNext={goNext}
            onPrev={goPrev}
            current={current}
            total={steps.length}
            direction={direction}
            isLast={current === steps.length - 1}
            saving={saving}
            onFinish={goToReview}
            coords={coords}
            onCoordsChange={setCoords}
            availabilityValue={step.type === "days-times" ? availability : undefined}
            onAvailabilityChange={step.type === "days-times" ? setAvailability : undefined}
            textValue={step.field === "themes_avoided" ? avoidedNotes : undefined}
            onTextChange={step.field === "themes_avoided" ? setAvoidedNotes : undefined}
          />
        )}

        {phase === "transition-review" && (
          <TransitionScreen
            key="transition-review"
            headline="Quase lá"
            subtext="Quanto melhor a calibração, melhores as recomendações da HIVIUM."
            onComplete={() => setPhase("review")}
            duration={2000}
          />
        )}

        {phase === "review" && (
          <ReviewScreen
            key="review"
            role={effectiveRole}
            answers={{ ...answers, availability_days: availability.days, availability_times: availability.times }}
            onEdit={goToStep}
            onConfirm={finishOnboarding}
            saving={saving}
          />
        )}

        {phase === "transition-mapped" && (
          <TransitionScreen
            key="transition-mapped"
            headline="Seu perfil está tomando forma"
            subtext="A HIVIUM já pode personalizar tudo para você."
            onComplete={() => setPhase("mapped")}
            duration={2200}
          />
        )}

        {phase === "mapped" && (
          <ProfileMappedScreen
            key="mapped"
            role={role}
            answers={{ ...answers, availability_days: availability.days, availability_times: availability.times }}
            onContinue={handleContinueToDashboard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
