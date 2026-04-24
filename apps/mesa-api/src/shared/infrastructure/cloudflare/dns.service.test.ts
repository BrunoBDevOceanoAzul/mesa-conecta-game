import { describe, it, expect } from "vitest";
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
    await expect(
      service.createSubdomainRecord("test", "target.com")
    ).rejects.toThrow("Cloudflare DNS error: Invalid token");
  });

  it("creates subdomain successfully with API token", async () => {
    let fetchCalled = false;
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      fetchCalled = true;
      const body = init?.body as string;
      expect(body).toContain("mestre-joao.sociodotabuleiro.app.br");
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
    expect(fetchCalled).toBe(true);
  });

  it("creates subdomain successfully with Global API Key", async () => {
    let fetchCalled = false;
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      fetchCalled = true;
      const headers = init?.headers as Record<string, string>;
      expect(headers["X-Auth-Email"]).toBe("bruno@oceanoazul.dev.br");
      expect(headers["X-Auth-Key"]).toBe("global-key");
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
    expect(fetchCalled).toBe(true);
  });
});
