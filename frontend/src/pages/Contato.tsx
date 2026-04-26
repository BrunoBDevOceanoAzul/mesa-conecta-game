import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function Contato() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Preencha nome, e-mail e mensagem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: form.name.trim().slice(0, 100),
        email: form.email.trim().slice(0, 255),
        phone: form.phone.trim().slice(0, 30) || null,
        message: form.message.trim().slice(0, 2000),
        source: "contato",
      });

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke("send-resend-email", {
        body: {
          to: "bruno@sociodotabuleiro.app.br",
          subject: `[HIVIUM Contato] ${form.name.trim()}`,
          html: `
            <h2>Nova mensagem de contato</h2>
            <p><strong>Nome:</strong> ${form.name.trim()}</p>
            <p><strong>E-mail:</strong> ${form.email.trim()}</p>
            ${form.phone.trim() ? `<p><strong>Telefone:</strong> ${form.phone.trim()}</p>` : ""}
            <hr/>
            <p>${form.message.trim().replace(/\n/g, "<br/>")}</p>
          `,
        },
      });

      setSent(true);
      toast.success("Mensagem enviada com sucesso!");
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="container mx-auto px-4 max-w-xl">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <span className="section-label">Contato</span>
            <h1 className="text-3xl sm:text-4xl font-display font-bold leading-tight tracking-tight text-foreground mt-3">
              Fale com a gente
            </h1>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
              Tem uma pergunta, sugestão ou quer conversar sobre parceria? Preencha o formulário e responderemos o mais rápido possível.
            </p>
          </motion.div>

          {sent ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold text-foreground">Mensagem enviada!</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Obrigado pelo contato. Retornaremos em breve para <strong>{form.email}</strong>.
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5 bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" maxLength={100} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" maxLength={255} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" maxLength={30} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder="Escreva sua mensagem..." rows={5} maxLength={2000} required />
              </div>
              <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar mensagem
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
