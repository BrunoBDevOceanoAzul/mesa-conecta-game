import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LifeBuoy } from "lucide-react";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill fields for contextual tickets like "delete mesa" */
  defaults?: {
    subject?: string;
    description?: string;
    category?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  };
  onCreated?: () => void;
}

const CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "exclusao_mesa", label: "Exclusão de Mesa" },
  { value: "financeiro", label: "Financeiro" },
  { value: "conta", label: "Minha Conta" },
  { value: "bug", label: "Problema Técnico" },
  { value: "sugestao", label: "Sugestão" },
];

export function CreateTicketDialog({
  open,
  onOpenChange,
  defaults,
  onCreated,
}: CreateTicketDialogProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(defaults?.subject || "");
  const [description, setDescription] = useState(defaults?.description || "");
  const [category, setCategory] = useState(defaults?.category || "geral");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !description.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: subject.trim(),
      description: description.trim(),
      category,
      related_entity_type: defaults?.relatedEntityType || null,
      related_entity_id: defaults?.relatedEntityId || null,
    });
    if (error) {
      toast.error("Erro ao abrir ticket: " + error.message);
    } else {
      toast.success("Ticket aberto com sucesso! Você será notificado sobre o andamento.");
      onOpenChange(false);
      setSubject("");
      setDescription("");
      setCategory("geral");
      onCreated?.();
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" /> Abrir Ticket de Suporte
          </DialogTitle>
          <DialogDescription>
            Descreva seu problema ou solicitação. Nossa equipe responderá o mais breve possível.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-foreground">Categoria</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Assunto *</label>
            <Input
              className="mt-1.5"
              placeholder="Resumo breve do problema..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Descrição *</label>
            <Textarea
              className="mt-1.5"
              placeholder="Descreva com detalhes o que está acontecendo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={sending || !subject.trim() || !description.trim()}>
            {sending ? "Enviando..." : "Enviar Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
