import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StepPhotoProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  onPrev: () => void;
  onComplete: () => void;
  saving: boolean;
}

export function StepPhoto({ imageUrl, onImageChange, onPrev, onComplete, saving }: StepPhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setUploading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const filePath = `avatars/${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("profiles").getPublicUrl(filePath);
      onImageChange(urlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onImageChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="relative">
          <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-border bg-muted flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-12 w-12 text-muted-foreground/40" />
            )}
          </div>
          {imageUrl && (
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">Sua foto de perfil</h3>
          <p className="text-sm text-muted-foreground mt-1">Adicione sua foto (opcional)</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        <div className="text-xs text-muted-foreground text-center max-w-xs">
          PNG, JPG, WEBP ou GIF. Máximo 5MB. Sua foto será pública no seu perfil.
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onPrev}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-card-hover text-foreground h-10 px-4 py-2 gap-2 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          Voltar
        </button>
        <div className="text-sm text-muted-foreground">Etapa 3 de 3</div>
        <button
          onClick={onComplete}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md text-sm font-semibold bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-105 h-10 px-6 py-2 gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Concluir
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
