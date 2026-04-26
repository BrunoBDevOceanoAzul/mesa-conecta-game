import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCharacterSheet } from "@/hooks/use-character-sheets";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { EpicoSheetEditor } from "@/components/sheet/EpicoSheetEditor";
import { ArrowLeft, Loader2, ScrollText } from "lucide-react";

export default function CharacterSheetEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sheet, setSheet, loading, autosave, uploadPortrait } = useCharacterSheet(id);
  const [saving, setSaving] = useState(false);

  const handleAutosave = (updates: any) => {
    setSaving(true);
    autosave(updates);
    // Update local state immediately
    setSheet(prev => prev ? { ...prev, ...updates } : prev);
    setTimeout(() => setSaving(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 pt-24 pb-16 text-center">
          <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold mb-2">Ficha não encontrada</h1>
          <button onClick={() => navigate("/fichas")} className="text-primary text-sm hover:underline">
            Voltar para minhas fichas
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
        <button
          onClick={() => navigate("/fichas")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Minhas Fichas
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display font-bold text-foreground">
              {sheet.character_name || "Novo Personagem"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Épico RPG</p>
        </div>

        <EpicoSheetEditor
          sheet={sheet}
          onUpdate={() => {}}
          onAutosave={handleAutosave}
          onUploadPortrait={uploadPortrait}
          saving={saving}
        />
      </div>
      <Footer />
    </div>
  );
}
