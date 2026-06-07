import type { Metadata } from "next";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";

import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { getMonthData, toDateKey } from "@/server/calendar";
import { matchSurcharge } from "@/lib/budget";
import { formatCents } from "@/lib/money";
import { CalendarView, type DayCell } from "./calendar-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendario · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function clampMonth(y: number, m: number) {
  // Normaliza desbordes de mes (0 → diciembre del año anterior, 13 → enero siguiente).
  const d = new Date(y, m - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);

  const sp = await searchParams;
  const now = new Date();
  const yReq = parseInt(sp.y ?? "", 10);
  const mReq = parseInt(sp.m ?? "", 10);
  const year = Number.isFinite(yReq) && yReq >= 2020 && yReq <= 2100 ? yReq : now.getFullYear();
  const month = Number.isFinite(mReq) && mReq >= 1 && mReq <= 12 ? mReq : now.getMonth() + 1;

  const data = await getMonthData(year, month);

  // Construye la rejilla (semanas empezando en lunes).
  const first = startOfMonth(new Date(year, month - 1, 1));
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(first), { weekStartsOn: 1 });
  const todayKey = toDateKey(now);

  const cells: DayCell[] = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((d) => {
    const dateKey = toDateKey(d);
    const wd = d.getDay();

    const block =
      data.blocks.find((b) => {
        const end = b.endDate ?? b.date;
        return dateKey >= b.date && dateKey <= end;
      }) ?? null;

    return {
      dateKey,
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1,
      isWeekend: wd === 0 || wd === 6,
      isToday: dateKey === todayKey,
      bookings: data.bookings
        .filter((b) => b.eventDate === dateKey)
        .map((b) => ({
          id: b.id,
          packName: b.packName,
          name: b.name,
          total: b.total,
          status: b.status,
          night: b.night,
        })),
      surcharges: data.surcharges
        .filter((s) => matchSurcharge(s, { date: dateKey, night: false }))
        .map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          isActive: s.isActive,
          valueLabel: s.valueType === "PERCENT" ? `+${s.value}%` : `+${formatCents(s.value)}`,
        })),
      block: block
        ? { id: block.id, reason: block.reason, isRange: block.endDate !== null && block.endDate !== block.date }
        : null,
    };
  });

  // Agrupa en semanas de 7.
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const prev = clampMonth(year, month - 1);
  const next = clampMonth(year, month + 1);

  return (
    <CalendarView
      weeks={weeks}
      monthLabel={`${MONTHS[month - 1]} ${year}`}
      prevHref={`/admin/calendario?y=${prev.year}&m=${prev.month}`}
      nextHref={`/admin/calendario?y=${next.year}&m=${next.month}`}
      todayHref="/admin/calendario"
    />
  );
}
