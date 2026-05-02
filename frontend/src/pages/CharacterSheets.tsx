import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useCharacterSheets } from "@/hooks/use-character-sheets";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ScrollText, Plus, Trash2, Loader2, User, Calendar, ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CharacterSheets() {
  const router = useRouter();
  const { user } = useAuth();
  const { sheets, loading, createSheet, deleteSheet } = useCharacterSheets("epico");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const sheet = await createSheet(newName.trim());
    setCreating(false);
    setShowCreate(false);
    setNewName("");
    if (sheet) router.push(`/fichas/${sheet.id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16 text-center">
          <ScrollText className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Fichas de Personagem</h1>
          <p className="text-muted-foreground mb-6">Faça login para criar e gerenciar seus personagens.</p>
          <Button variant="default" onClick={() => router.push("/login")}>Entrar</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <ScrollText className="h-6 w-6 text-primary" />
              Minhas Fichas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Épico RPG</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Personagem
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sheets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhum personagem ainda</h2>
            <p className="text-sm text-muted-foreground mb-6">Crie seu primeiro personagem para Épico RPG!</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Criar Personagem
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sheets.map((s) => (
              <Card
                key={s.id}
                className="p-4 cursor-pointer hover:border-primary/30 transition-all group"
                onClick={() => router.push(`/fichas/${s.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {s.portrait_url ? (
                      <img src={s.portrait_url} className="w-12 h-12 rounded-lg object-cover border border-border" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary/40" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                        {s.character_name || "Sem nome"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {s.player_name || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(s.updated_at), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Personagem</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do personagem"
            className="font-display"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir personagem?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteSheet(deleteId); setDeleteId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
