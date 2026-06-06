export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // El contenido es JSON serializado por nosotros (no input de usuario sin escapar).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
