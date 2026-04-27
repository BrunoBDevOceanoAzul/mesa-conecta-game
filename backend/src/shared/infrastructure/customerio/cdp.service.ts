export interface CustomerIoIdentifyInput {
  userId: string;
  traits: Record<string, unknown>;
}

export interface CustomerIoTrackInput {
  userId: string;
  event: string;
  properties?: Record<string, unknown>;
}

export class CustomerIoCdpService {
  constructor(
    private readonly writeKey: string | undefined,
    private readonly apiBaseUrl = "https://cdp.customer.io/v1",
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  get enabled(): boolean {
    return Boolean(this.writeKey);
  }

  async identify(input: CustomerIoIdentifyInput): Promise<void> {
    await this.request("/identify", {
      userId: input.userId,
      traits: input.traits,
    });
  }

  async track(input: CustomerIoTrackInput): Promise<void> {
    await this.request("/track", {
      userId: input.userId,
      event: input.event,
      properties: input.properties ?? {},
    });
  }

  private async request(path: string, body: Record<string, unknown>): Promise<void> {
    if (!this.writeKey) {
      throw new Error("CUSTOMERIO_CDP_WRITE_KEY is not configured");
    }

    const response = await this.fetchImpl(`${this.apiBaseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.writeKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Customer.io CDP request failed: ${response.status} ${details}`.slice(0, 1000));
    }
  }
}
