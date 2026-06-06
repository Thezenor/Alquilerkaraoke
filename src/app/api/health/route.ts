import { NextResponse } from "next/server";

// Healthcheck para Railway (y monitores). No toca BD para responder rápido.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", uptime: process.uptime() });
}
