export const STATUS_LABELS: Record<string, string> = {
  NEW: "Nueva",
  IN_PROGRESS: "En curso",
  ANSWERED: "Respondida",
  ARCHIVED: "Archivada",
};

export const STATUS_CLASSES: Record<string, string> = {
  NEW: "bg-brand-neon/15 text-brand-neon",
  IN_PROGRESS: "bg-amber-500/15 text-amber-300",
  ANSWERED: "bg-emerald-500/15 text-emerald-300",
  ARCHIVED: "bg-slate-500/15 text-slate-300",
};

export const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "ANSWERED", "ARCHIVED"] as const;
