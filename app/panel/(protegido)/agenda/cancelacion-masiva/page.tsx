import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioCancelacionMasiva } from "./_componentes/formulario-cancelacion-masiva";

export default async function PaginaCancelacionMasiva() {
  const supabase = await crearClienteServidor();
  const { data: medicos } = await supabase
    .from("medicos")
    .select("id, nombres, apellidos, titulo")
    .eq("activo", true)
    .order("apellidos");

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Cancelar el día de un médico</h1>
      <p className="mb-5 text-sm text-text-muted">
        Cuando un médico falta, cancela todas sus citas del día en una sola acción (§4.5). Cada paciente afectado queda con
        una notificación en cola — el envío real por WhatsApp es una automatización pendiente (Fase 5).
      </p>
      <FormularioCancelacionMasiva medicos={medicos ?? []} />
    </div>
  );
}
