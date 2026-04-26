import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LifeBuoy, BookOpen, MessageSquare, ChevronRight, HelpCircle, FileText, CreditCard, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateTicketDialog } from "@/components/support/CreateTicketDialog";

const categories = [
  { icon: <BookOpen className="h-5 w-5" />, title: "Primeiros Passos", desc: "Como criar conta, completar perfil e explorar mesas", articles: 5 },
  { icon: <CreditCard className="h-5 w-5" />, title: "Planos & Pagamentos", desc: "Assinaturas, cobranças, cancelamentos e reembolsos", articles: 8 },
  { icon: <Users className="h-5 w-5" />, title: "Para Mestres", desc: "Criar mesas, gerenciar reservas, CRM e monetização", articles: 12 },
  { icon: <FileText className="h-5 w-5" />, title: "Para Lojas", desc: "Perfil de luderia, agenda, slots e analytics", articles: 6 },
  { icon: <Shield className="h-5 w-5" />, title: "Segurança & Privacidade", desc: "LGPD, dados pessoais, denúncias e bloqueios", articles: 4 },
  { icon: <HelpCircle className="h-5 w-5" />, title: "FAQ Geral", desc: "Dúvidas frequentes sobre a plataforma", articles: 15 },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center py-12">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <LifeBuoy className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-h1 text-foreground">Central de Ajuda</h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Como podemos te ajudar? Busque nos artigos ou abra um ticket de suporte.
          </p>
          <div className="max-w-md mx-auto mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artigos..." className="pl-10" />
          </div>
        </section>

        {/* Categories */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <button key={i} onClick={() => navigate("/faq")} className="rounded-2xl border border-border bg-card p-5 text-left hover:shadow-md hover:border-primary/20 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cat.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2">{cat.articles} artigos</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="container mx-auto px-4 py-12 text-center">
          <div className="rounded-2xl bg-muted/40 border border-border p-8">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-display font-semibold text-foreground">Não encontrou o que procura?</h2>
            <p className="text-sm text-muted-foreground mt-1">Abra um ticket e nossa equipe responde em até 24h.</p>
            <Button className="mt-4 gap-1.5" onClick={() => setTicketOpen(true)}>
              <MessageSquare className="h-4 w-4" /> Abrir Ticket
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <CreateTicketDialog open={ticketOpen} onOpenChange={setTicketOpen} />
    </div>
  );
}
