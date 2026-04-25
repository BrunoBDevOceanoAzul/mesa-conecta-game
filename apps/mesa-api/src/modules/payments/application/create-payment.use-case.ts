import { UseCase } from "../../../shared/domain/use-case.js";
import { Payment, CreatePaymentInput, AsaasGateway, PaymentRepository } from "../domain/payment.js";

export class CreatePaymentUseCase implements UseCase<CreatePaymentInput, Payment> {
  constructor(
    private readonly asaasGateway: AsaasGateway,
    private readonly paymentRepository: PaymentRepository
  ) {}

  async execute(input: CreatePaymentInput): Promise<Payment> {
    if (input.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Criar cobrança no Asaas
    const asaasResponse = await this.asaasGateway.createPayment(input);

    // Buscar QR code PIX se for PIX
    let pixQrCode: string | null = null;
    let pixCopiaCola: string | null = null;

    if (input.billingType === "PIX" && asaasResponse.id) {
      const pixData = await this.asaasGateway.getPixQrCode(asaasResponse.id);
      if (pixData) {
        pixQrCode = pixData.qrCode;
        pixCopiaCola = pixData.copiaCola;
      }
    }

    // Salvar no banco
    const payment = await this.paymentRepository.create({
      bookingId: input.bookingId,
      asaasPaymentId: asaasResponse.id,
      amount: String(input.amount),
      currency: "BRL",
      billingType: input.billingType,
      status: "PENDING",
      invoiceUrl: asaasResponse.invoiceUrl || null,
      pixQrCode,
      pixCopiaCola,
    });

    return payment;
  }
}
