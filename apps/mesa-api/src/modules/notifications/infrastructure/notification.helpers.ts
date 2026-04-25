import { publishEvent } from "./sse.event-bus.js";

export function notifyBookingConfirmed(userId: string, booking: unknown): void {
  publishEvent(userId, "booking:confirmed", booking);
}

export function notifyBookingCanceled(userId: string, booking: unknown): void {
  publishEvent(userId, "booking:canceled", booking);
}

export function notifyPaymentReceived(userId: string, payment: unknown): void {
  publishEvent(userId, "payment:received", payment);
}

export function notifyMesaUpdated(userId: string, mesa: unknown): void {
  publishEvent(userId, "mesa:updated", mesa);
}
