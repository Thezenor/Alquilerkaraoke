import { prisma } from "@/lib/prisma";
import { derivePaymentStatus } from "@/lib/payments";

/** Recalcula amountPaid y paymentStatus de una reserva a partir de sus pagos. */
export async function recomputeBookingPayment(bookingId: string): Promise<void> {
  const [agg, booking] = await Promise.all([
    prisma.payment.aggregate({ where: { bookingId }, _sum: { amount: true } }),
    prisma.booking.findUnique({ where: { id: bookingId }, select: { total: true } }),
  ]);
  if (!booking) return;
  const amountPaid = agg._sum.amount ?? 0;
  await prisma.booking.update({
    where: { id: bookingId },
    data: { amountPaid, paymentStatus: derivePaymentStatus(amountPaid, booking.total) },
  });
}
