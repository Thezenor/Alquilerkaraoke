import { prisma } from "@/lib/prisma";

// Utilidades RGPD: baja de marketing (derecho de oposición) y anonimización
// (derecho de supresión). La anonimización conserva los importes/reservas por
// obligación legal/contable, pero borra los datos personales (PII).

const anonEmail = (id: string) => `deleted+${id}@anon.invalid`;

/** Marca marketingConsent=false en todos los registros con ese email. Devuelve nº afectados. */
export async function optOutMarketing(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return 0;

  const [contacts, bookings] = await prisma.$transaction([
    prisma.contactRequest.updateMany({
      where: { email: { equals: normalized, mode: "insensitive" }, marketingConsent: true },
      data: { marketingConsent: false },
    }),
    prisma.booking.updateMany({
      where: { email: { equals: normalized, mode: "insensitive" }, marketingConsent: true },
      data: { marketingConsent: false },
    }),
  ]);
  return contacts.count + bookings.count;
}

/** Anonimiza un cliente y la PII de sus reservas y contratos (conserva importes). */
export async function anonymizeCustomer(customerId: string): Promise<void> {
  await prisma.$transaction([
    // Contratos de las reservas del cliente: borra la PII de la firma.
    prisma.contract.updateMany({
      where: { booking: { customerId } },
      data: {
        signedName: null,
        signerIp: null,
        signerUserAgent: null,
        signatureImage: null,
      },
    }),
    prisma.booking.updateMany({
      where: { customerId },
      data: {
        name: "Cliente anonimizado",
        email: anonEmail(customerId),
        phone: null,
        message: null,
        marketingConsent: false,
        locale: null,
        ip: null,
        userAgent: null,
      },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: {
        email: anonEmail(customerId),
        name: null,
        phone: null,
        notes: null,
        isProfessional: false,
        discountPercent: 0,
      },
    }),
  ]);
}

/** Anonimiza una solicitud de contacto (borra PII y la archiva). */
export async function anonymizeContact(contactId: string): Promise<void> {
  await prisma.contactRequest.update({
    where: { id: contactId },
    data: {
      name: "Anonimizado",
      email: anonEmail(contactId),
      phone: null,
      city: null,
      message: "[eliminado a petición del interesado]",
      marketingConsent: false,
      status: "ARCHIVED",
      ip: null,
      userAgent: null,
    },
  });
}
