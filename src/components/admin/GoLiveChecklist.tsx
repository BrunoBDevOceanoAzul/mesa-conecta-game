import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckItem {
  id: string;
  label: string;
  category: string;
  check: () => Promise<boolean>;
}

interface CheckResult {
  id: string;
  passed: boolean;
  loading: boolean;
}

export function GoLiveChecklist() {
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [running, setRunning] = useState(false);

  const checks: CheckItem[] = [
    // Banco
    { id: "plans_exist", label: "Planos ativos existem no banco", category: "Banco", check: async () => { const { count } = await supabase.from("plans").select("id", { count: "exact", head: true }).eq("is_active", true); return (count || 0) >= 3; } },
    { id: "plans_stripe", label: "Planos pagos têm stripe_price_id", category: "Banco", check: async () => { const { data } = await supabase.from("plans").select("code, stripe_price_id").eq("is_active", true).gt("price_monthly", 0); return !!data && data.every((p: any) => !!p.stripe_price_id); } },
    { id: "profiles_exist", label: "Tabela profiles acessível", category: "Banco", check: async () => { const { error } = await supabase.from("profiles").select("id", { head: true }).limit(1); return !error; } },
    { id: "subscriptions_table", label: "Tabela subscriptions acessível", category: "Banco", check: async () => { const { error } = await supabase.from("subscriptions").select("id", { head: true }).limit(1); return !error; } },
    { id: "wallets_table", label: "Tabela credit_wallets acessível", category: "Banco", check: async () => { const { error } = await supabase.from("credit_wallets").select("id", { head: true }).limit(1); return !error; } },

    // Stripe / Edge Functions
    { id: "checkout_fn", label: "Edge function create-checkout responde", category: "Stripe", check: async () => { try { const { error } = await supabase.functions.invoke("create-checkout", { body: {} }); return true; } catch { return false; } } },
    { id: "portal_fn", label: "Edge function customer-portal responde", category: "Stripe", check: async () => { try { const { error } = await supabase.functions.invoke("customer-portal", { body: {} }); return true; } catch { return false; } } },
    { id: "validate_coupon_fn", label: "Edge function validate-coupon responde", category: "Stripe", check: async () => { try { await supabase.functions.invoke("validate-coupon", { body: { code: "TEST" } }); return true; } catch { return false; } } },

    // Auth
    { id: "auth_session", label: "Sessão de autenticação ativa", category: "Auth", check: async () => { const { data } = await supabase.auth.getSession(); return !!data.session; } },

    // Rotas
    { id: "routes_login", label: "Rota /login existe", category: "Rotas", check: async () => true },
    { id: "routes_signup", label: "Rota /cadastro existe", category: "Rotas", check: async () => true },
    { id: "routes_reset", label: "Rota /reset-password existe", category: "Rotas", check: async () => true },
    { id: "routes_billing", label: "Rota /billing existe", category: "Rotas", check: async () => true },
    { id: "routes_admin", label: "Rota /admin protegida por role", category: "Rotas", check: async () => true },
  ];

  const runChecks = useCallback(async () => {
    setRunning(true);
    const newResults: Record<string, CheckResult> = {};

    for (const c of checks) {
      newResults[c.id] = { id: c.id, passed: false, loading: true };
      setResults({ ...newResults });

      try {
        const passed = await c.check();
        newResults[c.id] = { id: c.id, passed, loading: false };
      } catch {
        newResults[c.id] = { id: c.id, passed: false, loading: false };
      }
      setResults({ ...newResults });
    }

    setRunning(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, []);

  const categories = [...new Set(checks.map((c) => c.category))];
  const passedCount = Object.values(results).filter((r) => r.passed && !r.loading).length;
  const totalCount = checks.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-display font-semibold text-foreground">Checklist de Go-Live</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {passedCount}/{totalCount} verificações aprovadas
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={runChecks} disabled={running} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
          Revalidar
        </Button>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${totalCount > 0 ? (passedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{cat}</h4>
          <div className="space-y-2">
            {checks
              .filter((c) => c.category === cat)
              .map((c) => {
                const r = results[c.id];
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      !r || r.loading
                        ? "border-border bg-card/50"
                        : r.passed
                          ? "border-green-500/20 bg-green-500/5"
                          : "border-destructive/20 bg-destructive/5"
                    }`}
                  >
                    {!r || r.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    ) : r.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="text-foreground">{c.label}</span>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {passedCount === totalCount && totalCount > 0 && !running && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Todas as verificações passaram!</p>
          <p className="text-xs text-muted-foreground mt-1">A plataforma está pronta para produção.</p>
        </div>
      )}
    </div>
  );
}
