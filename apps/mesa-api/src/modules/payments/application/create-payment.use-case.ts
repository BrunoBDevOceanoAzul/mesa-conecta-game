import { UseCase } from "../../../shared/domain/use-case.js";
import { Payment, CreatePaymentInput, AsaasGateway, PaymentRepository } from "../domain/payment.js";

export class CreatePaymentUseCase implements UseCase<CreatePaymentInput, Payment> {
  constructor(
    private readonly asaasGateway: AsaasGateway,
    private readonly paymentRepository: PaymentRepository
  ) {}

  async execute(input: CreatePaymentInput & { userId: string }): Promise<Payment> {
    if (input.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const asaasResponse = await this.asaasGateway.createPayment(input);

    let pixQrCode: string | null = null;
    let pixCopiaCola: string | null = null;

    if (input.billingType === "PIX" && asaasResponse.id) {
      const pixData = await this.asaasGateway.getPixQrCode(asaasResponse.id);
      if (pixData) {
        pixQrCode = pixData.qrCode;
        pixCopiaCola = pixData.copiaCola;
      }
    }

    const payment = await this.paymentRepository.create({
      userId: input.userId,
      externalPaymentId: asaasResponse.id,
      amount: input.amount,
      currency: "BRL",
      status: "pending",
      description: input.description,
      provider: "asaas",
      paymentType: "one_time",
      metadataJson: {
        bookingId: input.bookingId,
        billingType: input.billingType,
        pixQrCode,
        pixCopiaCola,
        invoiceUrl: asaasResponse.invoiceUrl,
      },
    });

    return payment;
  }
}
