export class CloudflareDNSService {
  constructor(
    private readonly zoneId: string,
    private readonly auth: { email: string; apiKey: string } | { apiToken: string }
  ) {}

  private getHeaders(): Record<string, string> {
    if ("apiToken" in this.auth) {
      return {
        Authorization: `Bearer ${this.auth.apiToken}`,
        "Content-Type": "application/json",
      };
    }
    return {
      "X-Auth-Email": this.auth.email,
      "X-Auth-Key": this.auth.apiKey,
      "Content-Type": "application/json",
    };
  }

  async createSubdomainRecord(
    slug: string,
    target: string,
    proxied: boolean = false
  ): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: "CNAME",
          name: `${slug}.sociodotabuleiro.app.br`,
          content: target,
          ttl: 1,
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
        headers: this.getHeaders(),
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
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to list DNS records");
    }

    return data.result;
  }

  async verifyToken(): Promise<boolean> {
    if ("apiToken" in this.auth) {
      const response = await fetch(
        "https://api.cloudflare.com/client/v4/user/tokens/verify",
        {
          headers: { Authorization: `Bearer ${this.auth.apiToken}` },
        }
      );
      const data = await response.json();
      return data.success === true;
    }
    // Global API Key doesn't have a verify endpoint, test with zone read
    try {
      await this.listRecords();
      return true;
    } catch {
      return false;
    }
  }
}
