import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const readRepo = (path) => readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");

describe("Next entrypoints", () => {
  it("loads the global stylesheet from pages/_app", () => {
    const app = read("pages/_app.tsx");

    assert.match(app, /import\s+["']@\/index\.css["'];/);
  });

  it("renders the Hive page inside its context provider layout", () => {
    const hivePage = read("pages/Hive.tsx");

    assert.match(hivePage, /from\s+["']@\/layouts\/HiveLayout["']/);
    assert.match(hivePage, /<HiveLayout>/);
  });

  it("serves lowercase aliases for public routes linked by the UI", () => {
    const nginx = readRepo("infra/docker/nginx.conf");
    const expectedAliases = {
      "/login": "/Login/index.html",
      "/cadastro": "/Signup/index.html",
      "/quem-somos": "/QuemSomos/index.html",
      "/faq": "/FAQPage/index.html",
      "/contato": "/Contato/index.html",
      "/privacidade": "/PrivacyPolicy/index.html",
      "/termos": "/TermsOfService/index.html",
      "/interesse": "/Interesse/index.html",
      "/para-lojas": "/ParaLojas/index.html",
      "/para-marcas": "/ParaMarcas/index.html",
      "/reset-password": "/ResetPassword/index.html",
      "/~oauth": "/OAuthCallback/index.html",
      "/hive": "/Hive/index.html",
      "/feed": "/Feed/index.html",
      "/billing": "/Billing/index.html",
      "/agenda": "/Agenda/index.html",
      "/checkout": "/Checkout/index.html",
      "/admin": "/Admin/index.html",
      "/admin/insights": "/admin/AdminInsights/index.html",
      "/admin/usuarios": "/admin/AdminUsers/index.html",
      "/admin/reviews": "/admin/AdminReviews/index.html",
      "/admin/feedback": "/admin/AdminFeedbackInsights/index.html",
      "/admin/campanha": "/admin/AdminCampaign/index.html",
      "/admin/catalogo": "/admin/AdminCatalog/index.html",
      "/admin/social": "/admin/AdminSocialPublisher/index.html",
      "/admin/configuracoes": "/admin/AdminSettings/index.html",
    };

    for (const [route, file] of Object.entries(expectedAliases)) {
      assert.match(nginx, new RegExp(`location = ${route.replace("/", "\\/")} `));
      assert.match(nginx, new RegExp(file.replaceAll("/", "\\/")));
    }
  });

  it("serves static-export placeholders for dynamic public routes", () => {
    const nginx = readRepo("infra/docker/nginx.conf");

    assert.match(nginx, /\/loja\/\[slug\]\/index\.html/);
    assert.match(nginx, /\/mestre\/\[slug\]\/index\.html/);
    assert.match(nginx, /\/post\/\[slug\]\/index\.html/);
    assert.match(nginx, /\/mesa\/\[id\]\/index\.html/);
    assert.match(nginx, /\/mesa\/\[id\]\/ficha\/index\.html/);
  });
});
