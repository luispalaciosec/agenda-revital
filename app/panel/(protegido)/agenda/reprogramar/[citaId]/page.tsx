import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioReprogramar } from "./_componentes/formulario-reprogramar";

export default async function PaginaReprogramar({ params }: { params: Promise<{ citaId: string }> }) {
  const { citaId } = await params;
  const supabase = await crearClienteServidor();

  const { data: cita, error } = await supabase
    .from("citas")
    .select(
      `id, codigo_publico, inicio, fin, estado,
       paciente:pacientes(nombres, apellidos),
       especialidad:especialidades(id, nombre),
       medico:medicos(id, nombres, apellidos, titulo)`
    )
    .eq("id", citaId)
    .single();

  if (error || !cita) notFound();

  if (cita.estado !== "confirmada") {
    return (
      <div className="mx-auto max-w-xl p-6">
        <p className="rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">
          Esta cita ya no está en un estado que se pueda reprogramar.
        </p>
      </div>
    );
  }

  const { data: medicos } = await supabase
    .from("medico_especialidad")
    .select("medico:medicos!inner(id, nombres, apellidos, titulo, activo)")
    .eq("especialidad_id", cita.especialidad!.id)
    .eq("medico.activo", true);

  return (
    <div className="mx-auto max-w-lg p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Reprogramar cita</h1>
      <p className="mb-5 text-sm text-text-muted">
        {cita.codigo_publico} · {cita.paciente?.nombres} {cita.paciente?.apellidos} · {cita.especialidad?.nombre}
      </p>
      <FormularioReprogramar
        citaId={cita.id}
        especialidadId={cita.especialidad!.id}
        medicos={(medicos ?? []).map((m) => m.medico)}
        medicoActualId={cita.medico?.id ?? null}
      />
    </div>
  );
}
