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

    const service = new CloudflareDNSService("bad-token", "zone-id");
    await assert.rejects(
      () => service.createSubdomainRecord("test", "target.com"),
      /Cloudflare DNS error: Invalid token/
    );
  });

  it("creates subdomain successfully", async () => {
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

    const service = new CloudflareDNSService("valid-token", "zone-id");
    await service.createSubdomainRecord(
      "mestre-joao",
      "sociodotabuleiro.app.br"
    );
    assert.ok(fetchCalled);
  });
});
