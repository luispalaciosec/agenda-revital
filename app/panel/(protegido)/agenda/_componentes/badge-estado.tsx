import type { Database } from "@/lib/supabase/database.types";

type EstadoCita = Database["public"]["Enums"]["estado_cita_enum"];

const ESTADOS: Record<EstadoCita, { etiqueta: string; clase: string }> = {
  solicitada: { etiqueta: "Solicitada", clase: "bg-warning-bg text-warning" },
  en_gestion: { etiqueta: "En gestión", clase: "bg-warning-bg text-warning" },
  confirmada: { etiqueta: "Confirmada", clase: "bg-success-bg text-success" },
  atendida: { etiqueta: "Atendida", clase: "bg-teal-surface text-teal-deep" },
  no_show: { etiqueta: "No-show", clase: "bg-danger-bg text-danger" },
  cancelada_paciente: { etiqueta: "Cancelada", clase: "bg-surface-sunken text-text-muted" },
  cancelada_centro: { etiqueta: "Cancelada (centro)", clase: "bg-surface-sunken text-text-muted" },
  reprogramada: { etiqueta: "Reprogramada", clase: "bg-info-bg text-navy" },
  rechazada: { etiqueta: "Rechazada", clase: "bg-surface-sunken text-text-muted" },
};

export function BadgeEstado({ estado }: { estado: EstadoCita }) {
  const { etiqueta, clase } = ESTADOS[estado];
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12.5px] font-medium ${clase}`}>
      {etiqueta}
    </span>
  );
}
