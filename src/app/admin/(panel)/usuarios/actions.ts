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
  const roles = formData
    .getAll("roles")
    .map(String)
    .filter((r) => ROLE_VALUES.includes(r)) as Role[];
  if (roles.length === 0) {
    return { status: "error", message: "Asigna al menos un rol." };
  }
  const isActive = d.isActive === "on";
  const isSelf = d.id && d.id === session.user.id;

  // Salvaguardas: no quitarte el superadmin ni desactivarte a ti mismo.
  if (isSelf && (!isActive || !roles.includes(Role.SUPERADMIN))) {
    return {
      status: "error",
      message: "No puedes quitarte el rol SUPERADMIN ni desactivar tu propia cuenta.",
    };
  }

  // Salvaguarda: el sistema debe conservar siempre al menos un superadmin activo.
  if (d.id && (!isActive || !roles.includes(Role.SUPERADMIN))) {
    const current = await prisma.user.findUnique({
      where: { id: d.id },
      select: { isActive: true, roles: true },
    });
    if (current?.isActive && current.roles.includes(Role.SUPERADMIN)) {
      const otherSuperadmins = await prisma.user.count({
        where: { id: { not: d.id }, isActive: true, roles: { has: Role.SUPERADMIN } },
      });
      if (otherSuperadmins === 0) {
        return {
          status: "error",
          message:
            "Es el último superadmin activo: no se puede desactivar ni quitarle el rol SUPERADMIN. Asigna antes ese rol a otro usuario activo.",
        };
      }
    }
  }

  const password = (d.password ?? "").trim();

  try {
    if (d.id) {
      const data: Record<string, unknown> = {
        name: d.name || null,
        email: d.email,
        roles,
        isActive,
      };
      if (password) {
        if (password.length < 8)
          return { status: "error", message: "La contraseña debe tener al menos 8 caracteres." };
        data.passwordHash = await bcrypt.hash(password, 12);
      }
      await prisma.user.update({ where: { id: d.id }, data });
      await logAudit({
        userId: session.user.id,
        action: "user.update",
        entity: "User",
        entityId: d.id,
        metadata: { roles },
      });
    } else {
      if (password.length < 8) {
        return {
          status: "error",
          message: "La contraseña inicial debe tener al menos 8 caracteres.",
        };
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
      await logAudit({
        userId: session.user.id,
        action: "user.create",
        entity: "User",
        entityId: created.id,
        metadata: { roles },
      });
    }
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { status: "error", message: "Ya existe un usuario con ese email." };
    }
    return { status: "error", message: "No se pudo guardar el usuario." };
  }

  redirect("/admin/usuarios");
}

const deleteSchema = z.object({ id: z.string().min(1) });

/**
 * Elimina un usuario de forma física. Es seguro porque todas las FKs hacia User
 * son SetNull (AuditLog, reservas, pagos, contratos, posts…) o Cascade
 * (accounts/sessions): la auditoría histórica se conserva con userId = null.
 */
export async function deleteUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  let session;
  try {
    session = await requireRole(Role.SUPERADMIN);
  } catch {
    return { status: "error", message: "Solo un superadmin puede eliminar usuarios." };
  }

  const parsed = deleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Datos no válidos." };
  }
  const { id } = parsed.data;

  // Salvaguardas: ni tu propia cuenta ni el último superadmin activo.
  if (id === session.user.id) {
    return { status: "error", message: "No puedes eliminar tu propia cuenta." };
  }
  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true, roles: true, isActive: true },
  });
  if (!target) {
    return { status: "error", message: "El usuario no existe." };
  }
  if (target.isActive && target.roles.includes(Role.SUPERADMIN)) {
    const otherSuperadmins = await prisma.user.count({
      where: { id: { not: id }, isActive: true, roles: { has: Role.SUPERADMIN } },
    });
    if (otherSuperadmins === 0) {
      return {
        status: "error",
        message:
          "Es el último superadmin activo: no se puede eliminar. Asigna antes el rol a otro usuario.",
      };
    }
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    // P2003: una FK restrictiva impide el borrado (no debería ocurrir con el schema actual).
    if (e && typeof e === "object" && "code" in e && e.code === "P2003") {
      return {
        status: "error",
        message:
          "Este usuario tiene actividad registrada que impide borrarlo; desactívalo en su lugar.",
      };
    }
    return { status: "error", message: "No se pudo eliminar el usuario." };
  }

  await logAudit({
    userId: session.user.id,
    action: "user.delete",
    entity: "User",
    entityId: id,
    metadata: { email: target.email, name: target.name, roles: target.roles },
  });

  redirect("/admin/usuarios");
}
