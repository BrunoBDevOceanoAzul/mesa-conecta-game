import { mockTables, SYSTEMS } from "@/data/mock";
import { TableCard } from "@/components/shared/TableCard";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useState } from "react";
import { Search } from "lucide-react";

export default function TableSearch() {
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("");
  const [format, setFormat] = useState("");

  const filtered = mockTables.filter((t) => {
    if (query && !t.title.toLowerCase().includes(query.toLowerCase()) && !t.city.toLowerCase().includes(query.toLowerCase())) return false;
    if (system && t.system !== system) return false;
    if (format && t.format !== format) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Explorar Mesas</h1>
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou cidade..." className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={system} onChange={(e) => setSystem(e.target.value)} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Todos os sistemas</option>
            {SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Todos os formatos</option>
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
            <option value="híbrido">Híbrido</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => <TableCard key={t.id} table={t} />)}
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground mt-12">Nenhuma mesa encontrada.</p>}
      </div>
      <Footer />
    </div>
  );
}
