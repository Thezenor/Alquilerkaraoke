import { prisma } from "@/lib/prisma";
import { derivePaymentStatus } from "@/lib/payments";

/**
 * Recalcula amountPaid y paymentStatus de una reserva a partir de sus pagos.
 * La lectura (suma) y la escritura van en una transacción para evitar que dos
 * recálculos concurrentes dejen el caché desincronizado de la suma real.
 */
export async function recomputeBookingPayment(bookingId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId }, select: { total: true } });
    if (!booking) return;
    const agg = await tx.payment.aggregate({ where: { bookingId }, _sum: { amount: true } });
    const amountPaid = agg._sum.amount ?? 0;
    await tx.booking.update({
      where: { id: bookingId },
      data: { amountPaid, paymentStatus: derivePaymentStatus(amountPaid, booking.total) },
    });
  });
}
