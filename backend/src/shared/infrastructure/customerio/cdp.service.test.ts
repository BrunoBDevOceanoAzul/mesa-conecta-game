import { describe, expect, it, vi } from "vitest";
import { CustomerIoCdpService } from "./cdp.service.js";

describe("CustomerIoCdpService", () => {
  it("sends identify requests with basic auth", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    const service = new CustomerIoCdpService(
      "write-key",
      "https://cdp.customer.io/v1",
      fetchMock as unknown as typeof fetch
    );

    await service.identify({
      userId: "user-1",
      traits: { email: "user@example.com", name: "User" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdp.customer.io/v1/identify",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from("write-key:").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-1",
          traits: { email: "user@example.com", name: "User" },
        }),
      })
    );
  });

  it("throws when write key is not configured", async () => {
    const service = new CustomerIoCdpService(undefined);

    await expect(
      service.track({ userId: "user-1", event: "signed_in" })
    ).rejects.toThrow("CUSTOMERIO_CDP_WRITE_KEY is not configured");
  });
});
