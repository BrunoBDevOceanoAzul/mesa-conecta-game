import { AsaasAccount, AsaasAccountRepository, AsaasCustomerGateway } from "../domain/asaas-account.js";

export class CreateAsaasAccountUseCase {
  constructor(
    private readonly repository: AsaasAccountRepository,
    private readonly gateway: AsaasCustomerGateway,
  ) {}

  async execute(input: {
    userId: string;
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    postalCode?: string;
  }): Promise<AsaasAccount> {
    const existing = await this.repository.findByUserId(input.userId);
    if (existing) {
      throw new Error("User already has an Asaas account");
    }

    const customer = await this.gateway.createCustomer({
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      phone: input.phone,
      postalCode: input.postalCode,
      externalReference: input.userId,
    });

    return this.repository.create({
      userId: input.userId,
      asaasCustomerId: customer.id,
      asaasWalletId: customer.walletId ?? null,
      name: input.name,
      email: input.email,
      cpfCnpj: input.cpfCnpj ?? null,
      phone: input.phone ?? null,
      postalCode: input.postalCode ?? null,
      status: "active",
      metadataJson: {},
    });
  }
}
