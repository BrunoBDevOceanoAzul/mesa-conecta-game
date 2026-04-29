import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronDown, X } from "lucide-react";
import { FORMAT_OPTIONS, EXPERIENCE_LEVELS, USER_TAGS } from "@/data/onboarding-mesaquest";

interface StepBasicInfoProps {
  data: {
    name: string;
    fullName: string;
    birthDate: string;
    cpf: string;
    dataDeclarationAccepted: boolean;
    bio: string;
    phoneNumber: string;
    favoriteFormat: string;
    experienceLevel: string;
    userTagIds: string[];
  };
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function getMaxDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function StepBasicInfo({ data, onChange, onNext }: StepBasicInfoProps) {
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const [showUserTagsDropdown, setShowUserTagsDropdown] = useState(false);
  const [bioLength, setBioLength] = useState(data.bio.length);

  const isStepValid = data.name.length > 0 && data.fullName.length > 0 && data.birthDate.length > 0 && data.cpf.length >= 11 && data.dataDeclarationAccepted;

  const selectedFormat = FORMAT_OPTIONS.find((f) => f.id === data.favoriteFormat);
  const selectedExperience = EXPERIENCE_LEVELS.find((e) => e.id === data.experienceLevel);
  const selectedUserTags = USER_TAGS.filter((t) => data.userTagIds.includes(t.id));

  function toggleUserTag(tagId: string) {
    const current = data.userTagIds;
    if (current.includes(tagId)) {
      onChange("userTagIds", current.filter((id) => id !== tagId));
    } else {
      onChange("userTagIds", [...current, tagId]);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Nome público <span className="text-destructive">*</span>
        </label>
        <input
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          placeholder="Seu nome"
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Nome completo (Dado privado) <span className="text-destructive">*</span>
        </label>
        <input
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          placeholder="Seu nome completo (como no documento)"
          value={data.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
        />
      </div>

      <div role="alert" className="relative w-full rounded-lg border p-4 bg-background text-foreground mb-2">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
          <div className="text-sm">
            De acordo com a Lei nº 15.211/2025, os dados abaixo são de preenchimento obrigatório. Conclua esta etapa para encontrar sua Aventura.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Data de Nascimento <span className="text-destructive">*</span>
        </label>
        <input
          type="date"
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          max={getMaxDate()}
          value={data.birthDate}
          onChange={(e) => onChange("birthDate", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          CPF <span className="text-destructive">*</span>
        </label>
        <input
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          placeholder="000.000.000-00"
          maxLength={14}
          value={data.cpf}
          onChange={(e) => onChange("cpf", formatCPF(e.target.value))}
        />
      </div>

      <div className="flex items-start space-x-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={data.dataDeclarationAccepted}
          onClick={() => onChange("dataDeclarationAccepted", !data.dataDeclarationAccepted)}
          className={`peer h-4 w-4 shrink-0 rounded-[2px] border mt-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${
            data.dataDeclarationAccepted ? "bg-primary border-primary" : "border-primary"
          }`}
        >
          {data.dataDeclarationAccepted && (
            <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <label
          className="font-medium text-sm leading-relaxed cursor-pointer"
          onClick={() => onChange("dataDeclarationAccepted", !data.dataDeclarationAccepted)}
        >
          Declaro que as informações acima citadas são verdadeiras, passíveis de verificação sobre lei art. 307 do Código Penal (Decreto-Lei nº 2.848/1940)
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bio</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          placeholder="Conte um pouco sobre você, suas experiências com RPG..."
          rows={4}
          maxLength={500}
          value={data.bio}
          onChange={(e) => {
            onChange("bio", e.target.value);
            setBioLength(e.target.value.length);
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span />
          <span>{bioLength}/500</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Telefone de contato</label>
        <input
          type="tel"
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={data.phoneNumber}
          onChange={(e) => onChange("phoneNumber", e.target.value)}
        />
      </div>

      <div className="space-y-2 relative">
        <label className="text-sm font-medium">Formato preferido</label>
        <button
          type="button"
          onClick={() => setShowFormatDropdown(!showFormatDropdown)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        >
          <span className={selectedFormat ? "" : "text-muted-foreground"}>
            {selectedFormat ? selectedFormat.name : "Selecione seu formato preferido"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        {showFormatDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                onClick={() => {
                  onChange("favoriteFormat", opt.id);
                  setShowFormatDropdown(false);
                }}
              >
                {opt.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 relative">
        <label className="text-sm font-medium">Nível de experiência</label>
        <button
          type="button"
          onClick={() => setShowExperienceDropdown(!showExperienceDropdown)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        >
          <span className={selectedExperience ? "" : "text-muted-foreground"}>
            {selectedExperience ? selectedExperience.name : "Selecione seu nível"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        {showExperienceDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
            {EXPERIENCE_LEVELS.map((opt) => (
              <button
                key={opt.id}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                onClick={() => {
                  onChange("experienceLevel", opt.id);
                  setShowExperienceDropdown(false);
                }}
              >
                {opt.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 relative">
        <label className="text-sm font-medium">Características pessoais</label>
        <button
          type="button"
          onClick={() => setShowUserTagsDropdown(!showUserTagsDropdown)}
          className="flex min-h-10 w-full items-center justify-between rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        >
          <div className="flex gap-1 flex-wrap">
            {selectedUserTags.length > 0 ? (
              selectedUserTags.map((tag) => (
                <span key={tag.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
                  {tag.name}
                  <button onClick={(e) => { e.stopPropagation(); toggleUserTag(tag.id); }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">Selecione características</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
        <p className="text-xs text-muted-foreground">Características que te descrevem como jogador</p>
        {showUserTagsDropdown && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
            {USER_TAGS.map((tag) => {
              const isSelected = data.userTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md ${
                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => toggleUserTag(tag.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded border ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                      {isSelected && (
                        <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {tag.name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-muted-foreground">Etapa 1 de 3</div>
        <button
          onClick={onNext}
          disabled={!isStepValid}
          className="inline-flex items-center justify-center rounded-md text-sm font-semibold bg-accent text-muted hover:bg-accent-hover h-10 px-4 py-2 gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
