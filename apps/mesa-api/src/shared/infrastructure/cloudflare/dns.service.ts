export class CloudflareDNSService {
  constructor(
    private readonly apiToken: string,
    private readonly zoneId: string
  ) {}

  async createSubdomainRecord(
    slug: string,
    target: string,
    proxied: boolean = false
  ): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: `${slug}.sociodotabuleiro.app.br`,
          content: target,
          ttl: 1, // Auto
          proxied,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      const errors = data.errors?.map((e: any) => e.message).join(", ");
      throw new Error(`Cloudflare DNS error: ${errors}`);
    }
  }

  async deleteSubdomainRecord(recordId: string): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!data.success) {
      const errors = data.errors?.map((e: any) => e.message).join(", ");
      throw new Error(`Cloudflare DNS delete error: ${errors}`);
    }
  }

  async listRecords(name?: string): Promise<any[]> {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`
    );
    if (name) url.searchParams.append("name", name);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to list DNS records");
    }

    return data.result;
  }

  async verifyToken(): Promise<boolean> {
    const response = await fetch(
      "https://api.cloudflare.com/client/v4/user/tokens/verify",
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      }
    );
    const data = await response.json();
    return data.success === true;
  }
}
