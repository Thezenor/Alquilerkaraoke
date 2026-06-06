import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Configuración base de Auth.js, segura para el Edge runtime (sin Prisma ni bcrypt).
 * La usa el middleware. Los providers y el adaptador se añaden en `index.ts` (Node).
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  // Con el provider de credenciales, Auth.js v5 exige estrategia JWT.
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.roles = user.roles ?? [];
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as Role[]) ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
