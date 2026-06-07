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
