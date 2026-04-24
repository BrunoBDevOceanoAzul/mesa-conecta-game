import { describe, it } from "node:test";
import assert from "node:assert";
import { CloudflareDNSService } from "./dns.service.js";

describe("CloudflareDNSService", () => {
  it("throws on API error", async () => {
    global.fetch = async () =>
      ({
        json: async () => ({
          success: false,
          errors: [{ message: "Invalid token" }],
        }),
      }) as Response;

    const service = new CloudflareDNSService("zone-id", {
      apiToken: "bad-token",
    });
    await assert.rejects(
      () => service.createSubdomainRecord("test", "target.com"),
      /Cloudflare DNS error: Invalid token/
    );
  });

  it("creates subdomain successfully with API token", async () => {
    let fetchCalled = false;
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      fetchCalled = true;
      const body = init?.body as string;
      assert.ok(body.includes("mestre-joao.sociodotabuleiro.app.br"));
      return {
        json: async () => ({
          success: true,
          result: { id: "record-123" },
        }),
      } as Response;
    };

    const service = new CloudflareDNSService("zone-id", {
      apiToken: "valid-token",
    });
    await service.createSubdomainRecord(
      "mestre-joao",
      "sociodotabuleiro.app.br"
    );
    assert.ok(fetchCalled);
  });

  it("creates subdomain successfully with Global API Key", async () => {
    let fetchCalled = false;
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      fetchCalled = true;
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers["X-Auth-Email"], "bruno@oceanoazul.dev.br");
      assert.equal(headers["X-Auth-Key"], "global-key");
      return {
        json: async () => ({
          success: true,
          result: { id: "record-456" },
        }),
      } as Response;
    };

    const service = new CloudflareDNSService("zone-id", {
      email: "bruno@oceanoazul.dev.br",
      apiKey: "global-key",
    });
    await service.createSubdomainRecord("loja-magica", "sociodotabuleiro.app.br");
    assert.ok(fetchCalled);
  });
});
