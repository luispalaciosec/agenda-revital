import { crearClienteServidor } from "@/lib/supabase/server";
import { VistaListaEspera, type EntradaListaEsperaVista } from "./_componentes/vista-lista-espera";

export default async function PaginaListaEspera() {
  const supabase = await crearClienteServidor();

  const [{ data: especialidades }, { data: medicosVinculos }, { data: entradas }] = await Promise.all([
    supabase.from("especialidades").select("id, nombre").eq("activa", true).order("nombre"),
    supabase.from("medico_especialidad").select("especialidad_id, medico:medicos!inner(id, nombres, apellidos, titulo, activo)").eq("medico.activo", true),
    supabase
      .from("lista_espera")
      .select(
        `id, fecha_deseada, notificado_en, expira_en, estado, creado_en,
         paciente:pacientes(nombres, apellidos),
         especialidad:especialidades(nombre),
         medico:medicos(nombres, apellidos, titulo)`
      )
      .in("estado", ["esperando", "notificado"])
      .order("creado_en"),
  ]);

  const entradasVista: EntradaListaEsperaVista[] = (entradas ?? []).map((e) => ({
    id: e.id,
    fechaDeseada: e.fecha_deseada,
    notificadoEn: e.notificado_en,
    expiraEn: e.expira_en,
    estado: e.estado,
    paciente: e.paciente,
    especialidad: e.especialidad,
    medico: e.medico,
  }));

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Lista de espera</h1>
      <p className="mb-5 text-sm text-text-muted">
        Al liberarse un cupo se notifica solo al primero (§3.2). El envío real por WhatsApp es una automatización pendiente
        (Fase 5); acá se gestiona el estado a mano.
      </p>
      <VistaListaEspera
        especialidades={especialidades ?? []}
        medicosVinculos={(medicosVinculos ?? []).map((m) => ({ especialidadId: m.especialidad_id, medico: m.medico }))}
        entradas={entradasVista}
      />
    </div>
  );
}
