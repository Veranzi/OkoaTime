export class PaymentError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "PaymentError";
  }
}
