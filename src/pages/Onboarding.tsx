import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { stepsMap, type RoleKey } from "@/lib/onboarding-steps";
import { roleThemes } from "@/lib/role-themes";
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

const dbRoleToRoleKey: Record<string, RoleKey> = {
  gm: "mestre",
  player: "jogador",
  store: "loja",
  brand: "marca",
  mestre: "mestre",
  jogador: "jogador",
  loja: "loja",
  marca: "marca",
};

export default function Onboarding() {
  const { role: paramRole } = useParams<{ role?: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const resolvedParamRole = paramRole ? (dbRoleToRoleKey[paramRole] || paramRole as RoleKey) : null;
  const [phase, setPhase] = useState<Phase>(resolvedParamRole ? "steps" : "welcome");
  const [role, setRole] = useState<RoleKey | null>(resolvedParamRole);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [availability, setAvailability] = useState<{ days: string[]; times: string[] }>({ days: [], times: [] });
  const [avoidedNotes, setAvoidedNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

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
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          if ((data as any).instagram_handle) setInstagramHandle((data as any).instagram_handle);
          if (data.bio) setAnswers((prev) => ({ ...prev, bio: data.bio }));
          if (Object.keys(loaded).length > 0) setAnswers((prev) => ({ ...prev, ...loaded }));
          if (data.role) {
            const mapped = dbRoleToRoleKey[data.role] || data.role as RoleKey;
            setRole(mapped);
          } else {
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
  const roleKeyToDbRole: Record<string, string> = {
    jogador: "player",
    mestre: "gm",
    loja: "store",
    marca: "brand",
  };
  const dbRole = roleKeyToDbRole[effectiveRole] || effectiveRole;
  const allSteps = stepsMap[effectiveRole] || [];
  const steps = allSteps.filter((s) => {
    if (!s.conditionalOn) return true;
    const depValue = answers[s.conditionalOn.field];
    return s.conditionalOn.values.includes(depValue as string);
  });

  const theme = roleThemes[effectiveRole];

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
      const partialData: Record<string, unknown> = {
        onboarding_step: stepNum,
        role: dbRole,
        bio: answers.bio || null,
        avatar_url: avatarUrl || null,
        instagram_handle: instagramHandle || null,
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
      };

      await supabase
        .from("profiles")
        .update(partialData as any)
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
        role: dbRole,
        bio: answers.bio || null,
        avatar_url: avatarUrl || null,
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

  const handleContinueToDashboard = async () => {
    const dbR = effectiveRole === "mestre" ? "gm" : effectiveRole === "loja" ? "store" : null;
    if (dbR && (dbR === "gm" || dbR === "store")) {
      try {
        await supabase.functions.invoke("create-connect-account");
      } catch (err) {
        console.warn("[Onboarding] Connect account auto-creation failed (non-blocking):", err);
      }
    }

    const dashMap: Record<RoleKey, string> = {
      jogador: "/dashboard/jogador",
      mestre: "/dashboard/mestre",
      loja: "/dashboard/loja",
      marca: "/boost",
    };
    navigate(dashMap[effectiveRole] || "/dashboard/jogador");
  };

  const step = steps[current];

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
          <WelcomeScreen key="welcome" onStart={() => setPhase("profile")} role={role} />
        )}

        {phase === "profile" && (
          <ProfileSelect key="profile" onSelect={handleSelectRole} />
        )}

        {phase === "transition-start" && (
          <TransitionScreen
            key="transition-start"
            headline={theme.transitionStart.headline}
            subtext={theme.transitionStart.subtext}
            onComplete={() => setPhase("steps")}
            duration={2400}
            role={effectiveRole}
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
            avatarUrl={step.type === "bio-avatar" ? avatarUrl : undefined}
            onAvatarChange={step.type === "bio-avatar" ? setAvatarUrl : undefined}
          />
        )}

        {phase === "transition-review" && (
          <TransitionScreen
            key="transition-review"
            headline={theme.transitionReview.headline}
            subtext={theme.transitionReview.subtext}
            onComplete={() => setPhase("review")}
            duration={2000}
            role={effectiveRole}
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
            headline={theme.transitionMapped.headline}
            subtext={theme.transitionMapped.subtext}
            onComplete={() => setPhase("mapped")}
            duration={2200}
            role={effectiveRole}
          />
        )}

        {phase === "mapped" && (
          <ProfileMappedScreen
            key="mapped"
            role={effectiveRole}
            answers={{ ...answers, availability_days: availability.days, availability_times: availability.times }}
            onContinue={handleContinueToDashboard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
