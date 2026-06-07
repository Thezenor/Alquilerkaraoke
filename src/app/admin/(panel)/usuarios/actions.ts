"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { Role } from "@/generated/prisma/enums";

const ROLE_VALUES = Object.values(Role) as string[];

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().max(120).optional(),
  email: z.email(),
  password: z.string().optional(),
  isActive: z.string().optional(),
});

export type UserFormState = { status: "idle" | "error"; message?: string };

export async function saveUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  let session;
  try {
    session = await requireRole(Role.SUPERADMIN);
  } catch {
    return { status: "error", message: "Solo un superadmin puede gestionar usuarios." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  // Roles válidos desde el enum
  const roles = formData.getAll("roles").map(String).filter((r) => ROLE_VALUES.includes(r)) as Role[];
  if (roles.length === 0) {
    return { status: "error", message: "Asigna al menos un rol." };
  }
  const isActive = d.isActive === "on";
  const isSelf = d.id && d.id === session.user.id;

  // Salvaguardas: no quitarte el superadmin ni desactivarte a ti mismo.
  if (isSelf && (!isActive || !roles.includes(Role.SUPERADMIN))) {
    return { status: "error", message: "No puedes quitarte el rol SUPERADMIN ni desactivar tu propia cuenta." };
  }

  const password = (d.password ?? "").trim();

  try {
    if (d.id) {
      const data: Record<string, unknown> = { name: d.name || null, email: d.email, roles, isActive };
      if (password) {
        if (password.length < 8) return { status: "error", message: "La contraseña debe tener al menos 8 caracteres." };
        data.passwordHash = await bcrypt.hash(password, 12);
      }
      await prisma.user.update({ where: { id: d.id }, data });
      await logAudit({ userId: session.user.id, action: "user.update", entity: "User", entityId: d.id, metadata: { roles } });
    } else {
      if (password.length < 8) {
        return { status: "error", message: "La contraseña inicial debe tener al menos 8 caracteres." };
      }
      const created = await prisma.user.create({
        data: {
          name: d.name || null,
          email: d.email,
          roles,
          isActive,
          passwordHash: await bcrypt.hash(password, 12),
          emailVerified: new Date(),
        },
      });
      await logAudit({ userId: session.user.id, action: "user.create", entity: "User", entityId: created.id, metadata: { roles } });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un usuario con ese email." };
    }
    return { status: "error", message: "No se pudo guardar el usuario." };
  }

  redirect("/admin/usuarios");
}
