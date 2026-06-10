import { prisma } from "@/lib/prisma";
import type { Surcharge } from "@/generated/prisma/client";

// Datos del calendario admin. Se consulta por mes (página dinámica, sin caché).

export type MonthBooking = {
  id: string;
  packName: string;
  name: string;
  total: number;
  status: string;
  eventDate: string; // YYYY-MM-DD
  night: boolean;
};

export type MonthBlock = {
  id: string;
  date: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  reason: string | null;
};

export type MonthData = {
  year: number;
  month: number; // 1–12
  bookings: MonthBooking[];
  blocks: MonthBlock[];
  surcharges: Surcharge[];
};

/** YYYY-MM-DD en horario local (sin desfase de zona). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Comprueba si una fecha (YYYY-MM-DD) está disponible para nuevas solicitudes:
 * sin bloqueo de agenda (DateBlock, suelto o en rango) y sin reserva CONFIRMED
 * ese mismo día. Usado por el flujo público (defensa en servidor).
 */
export async function isDateAvailable(dateKey: string): Promise<boolean> {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return false;
  const dayStart = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0);
  if (Number.isNaN(dayStart.getTime())) return false;
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);

  const [block, confirmed] = await Promise.all([
    prisma.dateBlock.findFirst({
      where: {
        OR: [
          // Bloqueo de un solo día.
          { endDate: null, date: { gte: dayStart, lt: nextDay } },
          // Bloqueo en rango que cubre el día.
          { date: { lt: nextDay }, endDate: { gte: dayStart } },
        ],
      },
      select: { id: true },
    }),
    prisma.booking.findFirst({
      where: { status: "CONFIRMED", eventDate: { gte: dayStart, lt: nextDay } },
      select: { id: true },
    }),
  ]);

  return !block && !confirmed;
}

/** Carga reservas, bloqueos y suplementos relevantes para un mes (year, month 1–12). */
export async function getMonthData(year: number, month: number): Promise<MonthData> {
  const from = new Date(year, month - 1, 1, 0, 0, 0);
  const to = new Date(year, month, 1, 0, 0, 0); // primer día del mes siguiente

  const [bookings, blocks, surcharges] = await Promise.all([
    prisma.booking.findMany({
      where: { eventDate: { gte: from, lt: to } },
      select: { id: true, packName: true, name: true, total: true, status: true, eventDate: true, night: true },
      orderBy: { eventDate: "asc" },
    }),
    // Bloqueos que se solapan con el mes (un bloqueo puede ser un rango).
    prisma.dateBlock.findMany({
      where: {
        OR: [
          { date: { gte: from, lt: to } },
          { endDate: { gte: from, lt: to } },
          { AND: [{ date: { lt: from } }, { endDate: { gte: to } }] },
        ],
      },
      orderBy: { date: "asc" },
    }),
    prisma.surcharge.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    year,
    month,
    bookings: bookings.map((b) => ({
      id: b.id,
      packName: b.packName,
      name: b.name,
      total: b.total,
      status: b.status,
      eventDate: b.eventDate ? toDateKey(b.eventDate) : "",
      night: b.night,
    })),
    blocks: blocks.map((b) => ({
      id: b.id,
      date: toDateKey(b.date),
      endDate: b.endDate ? toDateKey(b.endDate) : null,
      reason: b.reason,
    })),
    surcharges,
  };
}
