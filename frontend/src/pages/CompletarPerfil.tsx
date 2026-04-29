import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingProgress } from "@/components/onboarding-mesaquest/OnboardingProgress";
import { StepBasicInfo } from "@/components/onboarding-mesaquest/StepBasicInfo";
import { StepPreferences } from "@/components/onboarding-mesaquest/StepPreferences";
import { StepPhoto } from "@/components/onboarding-mesaquest/StepPhoto";
import { saveOnboarding, loadExistingOnboarding } from "@/lib/onboarding-api";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/hivium-logo.png";

const steps = [
  { number: 1, title: "Informações Básicas", subtitle: "Seus dados pessoais" },
  { number: 2, title: "Preferências", subtitle: "Seus gostos em RPG" },
  { number: 3, title: "Foto de Perfil", subtitle: "Personalize seu perfil" },
];

export default function CompletarPerfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    fullName: "",
    birthDate: "",
    cpf: "",
    dataDeclarationAccepted: false,
    bio: "",
    phoneNumber: "",
    favoriteFormat: "",
    experienceLevel: "",
    userTagIds: [] as string[],
  });

  const [preferences, setPreferences] = useState({
    rpgSystems: [] as string[],
    tags: [] as string[],
    languages: [] as string[],
    platforms: [] as string[],
    availableDays: [] as string[],
  });

  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const existing = await loadExistingOnboarding();
      if (existing) {
        setBasicInfo({
          name: existing.name || "",
          fullName: existing.fullName || "",
          birthDate: existing.birthDate || "",
          cpf: existing.cpf || "",
          dataDeclarationAccepted: existing.dataDeclarationAccepted || false,
          bio: existing.bio || "",
          phoneNumber: existing.phoneNumber || "",
          favoriteFormat: existing.favoriteFormat || "",
          experienceLevel: existing.experienceLevel || "",
          userTagIds: existing.userTagIds || [],
        });
        setPreferences({
          rpgSystems: existing.rpgSystems || [],
          tags: existing.tags || [],
          languages: existing.languages || [],
          platforms: existing.platforms || [],
          availableDays: existing.availableDays || [],
        });
        setAvatarUrl(existing.avatarUrl || "");
      }
      setLoading(false);
    }
    checkAuthAndLoad();
  }, [navigate]);

  function handleBasicInfoChange(field: string, value: unknown) {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
  }

  function handlePreferencesChange(field: string, value: unknown) {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  }

  async function handleComplete() {
    setSaving(true);
    const result = await saveOnboarding({
      ...basicInfo,
      ...preferences,
      avatarUrl,
    });
    setSaving(false);

    if (result.success) {
      toast({
        title: "Perfil completo! 🎲",
        description: "Suas preferências foram salvas. Prepare-se para a aventura!",
      });
      navigate("/hive", { replace: true });
    } else {
      toast({
        title: "Erro ao salvar",
        description: result.error || "Não foi possível salvar suas informações. Tente novamente.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-[#662583] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/hive")} className="inline-flex items-center gap-2">
            <img src={logoImg.src} alt="HIVIUM" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold text-sm gradient-text">HIVIUM</span>
          </button>
          <button
            onClick={() => navigate("/hive")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular por enquanto
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Complete seu perfil
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Leva menos de 2 minutos. Isso nos ajuda a encontrar as melhores mesas para você.
            </p>
          </div>

          {/* Progress Stepper */}
          <div className="mb-8">
            <OnboardingProgress steps={steps} currentStep={currentStep} />
          </div>

          {/* Step Content */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <StepBasicInfo
                  key="step1"
                  data={basicInfo}
                  onChange={handleBasicInfoChange}
                  onNext={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 2 && (
                <StepPreferences
                  key="step2"
                  data={preferences}
                  onChange={handlePreferencesChange}
                  onPrev={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                />
              )}
              {currentStep === 3 && (
                <StepPhoto
                  key="step3"
                  imageUrl={avatarUrl}
                  onImageChange={setAvatarUrl}
                  onPrev={() => setCurrentStep(2)}
                  onComplete={handleComplete}
                  saving={saving}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
