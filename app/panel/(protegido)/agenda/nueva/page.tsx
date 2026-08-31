import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioNuevaCita } from "./_componentes/formulario-nueva-cita";

export default async function PaginaNuevaCita() {
  const supabase = await crearClienteServidor();

  const [especialidadesRes, serviciosRes, medicosRes] = await Promise.all([
    supabase
      .from("especialidades")
      .select("id, nombre, modo, duracion_min")
      .neq("modo", "solicitud")
      .eq("activa", true)
      .order("nombre"),
    supabase
      .from("servicios")
      .select("id, especialidad_id, descripcion")
      .eq("agendable", true)
      .eq("activo", true)
      .order("descripcion"),
    supabase
      .from("medico_especialidad")
      .select("especialidad_id, medico:medicos!inner(id, nombres, apellidos, titulo, activo)")
      .eq("medico.activo", true),
  ]);

  const especialidades = especialidadesRes.data ?? [];
  const servicios = serviciosRes.data ?? [];
  const medicosPorEspecialidad = (medicosRes.data ?? []).map((m) => ({
    especialidadId: m.especialidad_id,
    medico: m.medico,
  }));

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-5 text-[22px] font-semibold text-text">Nueva cita</h1>
      <FormularioNuevaCita
        especialidades={especialidades}
        servicios={servicios}
        medicosPorEspecialidad={medicosPorEspecialidad}
      />
    </div>
  );
}
