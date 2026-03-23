import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Split text into ~500-word chunks with overlap */
function chunkText(text: string, maxTokens = 500, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxTokens) return [text.trim()];
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const end = Math.min(i + maxTokens, words.length);
    chunks.push(words.slice(i, end).join(" "));
    i = end - overlap;
    if (i >= words.length - overlap) break;
  }
  return chunks;
}

async function ingestContent(
  supabase: any,
  title: string,
  content: string,
  sourceType: string,
  sourceRef: string,
) {
  // Delete old docs of same source_ref
  await supabase
    .from("knowledge_documents")
    .delete()
    .eq("source_ref", sourceRef);

  const { data: doc, error: docErr } = await supabase
    .from("knowledge_documents")
    .insert({ title, source_type: sourceType, source_ref: sourceRef, is_active: true })
    .select("id")
    .single();

  if (docErr) {
    console.error(`Failed to create doc ${title}:`, docErr);
    return 0;
  }

  const chunks = chunkText(content);
  const { error: chunkErr } = await supabase.from("knowledge_chunks").insert(
    chunks.map((c, i) => ({
      document_id: doc.id,
      chunk_index: i,
      content: c,
      token_count: c.split(/\s+/).length,
    }))
  );

  if (chunkErr) console.error(`Failed chunks for ${title}:`, chunkErr);
  return chunks.length;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: Record<string, number> = {};

    // 1. FAQ content
    const faqContent = `O que é a HIVIUM?
A plataforma que conecta jogadores, mestres e luderias de RPG com matchmaking inteligente, CRM nativo e ferramentas de crescimento. Não somos diretório — somos ecossistema.

Como funciona o matchmaking?
Você responde uma calibração sobre gostos, estilo, cidade e disponibilidade. A HIVIUM cruza tudo e exibe um score de aderência em cada mesa.

Preciso pagar para jogar?
Criar conta e navegar é grátis. Planos dão acesso a reservas, prioridade e ferramentas avançadas. O preço da sessão é definido pelo mestre.

Sou mestre. Como ganho com a plataforma?
Perfil profissional, mesas publicadas, reservas automáticas, CRM integrado. Com Pro+: analytics completo e destaque no feed.

Como funciona o destaque de mesas?
Compre créditos, destaque mesas ou posts por 7 dias, pague por clique (CPC). Founders ganham 3 destaques grátis/mês por 6 meses.

Tenho uma luderia. O que ganho?
Perfil, agenda pública, gestão de mesas, visibilidade regional e analytics. A partir de R$79,90/mês.

O que é a calibração de perfil?
Questionário inteligente que mapeia seu perfil: sistemas, estilo, disponibilidade, orçamento e preferências. Alimenta matchmaking, CRM e curadoria.`;

    results["FAQ"] = await ingestContent(supabase, "FAQ da HIVIUM", faqContent, "faq", "faq_landing");

    // 2. Billing products (plans)
    const { data: products } = await supabase
      .from("billing_products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (products && products.length > 0) {
      const plansContent = products.map((p: any) =>
        `Plano: ${p.name} (código: ${p.code})\nPerfil alvo: ${p.target_role || "todos"}\nPreço: R$ ${(p.price_cents / 100).toFixed(2)}/${p.billing_cycle || "mensal"}\nDescrição: ${p.description || "—"}\nFeature Flags: ${JSON.stringify(p.feature_flags || {})}`
      ).join("\n\n---\n\n");
      results["Planos"] = await ingestContent(supabase, "Planos e Assinaturas HIVIUM", plansContent, "db_plans", "billing_products");
    }

    // 3. Admin settings
    const { data: settings } = await supabase.from("admin_settings").select("key, value");
    if (settings && settings.length > 0) {
      const settingsContent = settings.map((s: any) => `${s.key}: ${JSON.stringify(s.value)}`).join("\n");
      results["Config"] = await ingestContent(supabase, "Configurações da Plataforma", settingsContent, "db_settings", "admin_settings");
    }

    // 4. Platform overview (hardcoded from product map)
    const platformOverview = `HIVIUM - Mapa Completo do Produto

A HIVIUM é uma plataforma que conecta jogadores, mestres e luderias de RPG e jogos de tabuleiro. O sistema oferece:

FUNCIONALIDADES PRINCIPAIS:
- Autenticação com email/senha e OAuth Google
- Onboarding/Anamnese multi-step por perfil (jogador, mestre, loja, marca)
- Match Score: algoritmo de compatibilidade jogador↔mesa baseado em preferências
- Busca de Mesas com filtros por sistema, cidade, data, formato, preço
- Sistema de Reservas (Bookings) com controle de vagas
- CRM do Mestre com pipeline de leads, contatos, interações
- Calculadora de Preço por sessão
- Gamificação com XP, níveis, títulos, badges, missões, tier roadmap
- Assinaturas e Planos por perfil via Asaas (PIX, Cartão)
- Cupons de Desconto
- Boost/Destaque com wallet de créditos e campanhas CPC
- Compartilhamento de mesas com analytics
- Mapa de Lojas com Google Maps
- Feed da comunidade
- Módulo de sessão com assets (imagens, áudio), rolagem de dados e cues
- Chat e mensagens entre usuários
- Notificações in-app
- Avaliações e reviews de mesas/mestres
- Sistema de fichas de personagem

PERFIS DE USUÁRIO:
- Jogador (player): busca mesas, reserva vagas, favorita conteúdo
- Mestre (gm): cria mesas, gerencia sessões, CRM, analytics, monetização
- Loja/Luderia (store): agenda, espaço físico, mesas hospedadas, analytics
- Marca (brand): campanhas publicitárias, segmentação, métricas

PÁGINAS DO ADMIN:
- Painel operacional com KPIs e go-live checklist
- Insights de mercado com gap analysis e clusters
- Gestão de usuários com filtros e ações
- Configurações comerciais (CPC, founder, taxa)
- Campanha e social publisher
- Reviews e feedback insights
- Catálogo de jogos

INTEGRAÇÕES:
- Asaas (pagamentos PIX/Cartão, assinaturas, subcontas)
- Google Maps (autocomplete, geocoding)
- Google OAuth (autenticação social)
- Resend (email transacional)
- IA (geração de imagens, copy, conteúdo)`;

    results["Visão Geral"] = await ingestContent(supabase, "Visão Geral da Plataforma HIVIUM", platformOverview, "document", "platform_overview");

    // 5. Privacy policy summary
    const privacyContent = `Política de Privacidade HIVIUM
A plataforma HIVIUM (anteriormente Sócio do Tabuleiro) trata dados pessoais em conformidade com a LGPD (Lei 13.709/2018).
Dados coletados: nome, email, cidade, preferências de jogo, dados de pagamento.
Base legal: consentimento, execução de contrato, interesse legítimo.
Compartilhamento: apenas com processadores de pagamento (Asaas) e serviços essenciais.
Direitos do titular: acesso, correção, exclusão, portabilidade.
Contato DPO: bruno@sociodotabuleiro.app.br`;

    results["Privacidade"] = await ingestContent(supabase, "Política de Privacidade", privacyContent, "legal", "privacy_policy");

    // 6. Terms summary
    const termsContent = `Termos de Serviço HIVIUM
Empresa: BFF COMERCIO E SERVICOS LTDA - ME (CNPJ 35.295.043/0001-26)
Perfis: Jogador, Mestre/Organizador, Lojista
Responsabilidades: manter dados atualizados, não violar direitos de terceiros
Pagamentos: processados via Asaas, PIX ou cartão
Cancelamento: pode ser feito a qualquer momento, acesso mantido até fim do ciclo
Propriedade intelectual: todo conteúdo da plataforma é de propriedade da HIVIUM
Limitação de responsabilidade: plataforma intermediária, não responsável por conteúdo de terceiros`;

    results["Termos"] = await ingestContent(supabase, "Termos de Serviço", termsContent, "legal", "terms_of_service");

    return new Response(
      JSON.stringify({ success: true, seeded: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("seed error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
