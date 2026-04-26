import {
  AsaasGateway,
  CreatePaymentInput,
  AsaasPaymentResponse,
  SplitInput,
} from "../domain/payment.js";
import { AsaasCustomerGateway } from "../../asaas-accounts/domain/asaas-account.js";

const ASAAS_BASE = "https://api.asaas.com/v3";

export class HttpAsaasGateway implements AsaasGateway, AsaasCustomerGateway {
  constructor(private readonly apiKey: string) {}

  private async fetchAsaas(path: string, options: RequestInit = {}): Promise<unknown> {
    const response = await fetch(`${ASAAS_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "access_token": this.apiKey,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Asaas API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async createCustomer(input: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    postalCode?: string;
    externalReference?: string;
  }): Promise<{ id: string; walletId?: string }> {
    const result = await this.fetchAsaas("/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const data = result as Record<string, unknown>;
    return {
      id: String(data.id),
      walletId: data.walletId ? String(data.walletId) : undefined,
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<AsaasPaymentResponse> {
    const body = {
      customer: undefined, // Will be created or fetched
      name: input.customerName,
      cpfCnpj: input.customerCpfCnpj,
      email: input.customerEmail,
      value: input.amount,
      billingType: input.billingType,
      description: input.description,
      externalReference: input.bookingId,
    };

    const result = await this.fetchAsaas("/payments", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = result as Record<string, unknown>;

    return {
      id: String(data.id),
      status: String(data.status),
      invoiceUrl: String(data.invoiceUrl || ""),
      pixQrCode: data.pixQrCode ? String(data.pixQrCode) : undefined,
      pixCopiaCola: data.pixCopiaCola ? String(data.pixCopiaCola) : undefined,
    };
  }

  async createSplitPayment(
    input: CreatePaymentInput & { split: SplitInput }
  ): Promise<AsaasPaymentResponse> {
    const body = {
      customer: undefined,
      name: input.customerName,
      cpfCnpj: input.customerCpfCnpj,
      email: input.customerEmail,
      value: input.amount,
      billingType: input.billingType,
      description: input.description,
      externalReference: input.bookingId,
      split: {
        walletId: input.split.walletId,
        percentualValue: input.split.percentualValue,
        fixedValue: input.split.fixedValue,
      },
    };

    const result = await this.fetchAsaas("/payments", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = result as Record<string, unknown>;

    return {
      id: String(data.id),
      status: String(data.status),
      invoiceUrl: String(data.invoiceUrl || ""),
      pixQrCode: data.pixQrCode ? String(data.pixQrCode) : undefined,
      pixCopiaCola: data.pixCopiaCola ? String(data.pixCopiaCola) : undefined,
    };
  }

  async getPixQrCode(asaasPaymentId: string): Promise<{ qrCode: string; copiaCola: string } | null> {
    try {
      const result = await this.fetchAsaas(`/payments/${asaasPaymentId}/pixQrCode`);
      const data = result as Record<string, unknown>;
      return {
        qrCode: String(data.encodedImage || data.qrCode || ""),
        copiaCola: String(data.payload || data.copiaCola || ""),
      };
    } catch {
      return null;
    }
  }
}
