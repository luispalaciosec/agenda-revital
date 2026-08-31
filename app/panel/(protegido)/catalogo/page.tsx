import { crearClienteServidor } from "@/lib/supabase/server";
import { VistaCatalogo } from "./_componentes/vista-catalogo";

export default async function PaginaCatalogo() {
  const supabase = await crearClienteServidor();

  const { data: sede } = await supabase.from("sedes").select("id").limit(1).single();
  const sedeId = sede?.id ?? "";

  const [{ data: especialidades }, { data: medicos }, { data: vinculos }, { data: consultorios }] = await Promise.all([
    supabase.from("especialidades").select("id, nombre, slug, modo, duracion_min, cupos_por_bloque, activa").order("nombre"),
    supabase.from("medicos").select("id, nombres, apellidos, titulo, celular, correo, activo").order("apellidos"),
    supabase.from("medico_especialidad").select("medico_id, especialidad_id"),
    supabase.from("consultorios").select("id, nombre, numero, activo").order("numero"),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Catálogo</h1>
      <p className="mb-5 text-sm text-text-muted">
        Especialidades, médicos, consultorios, servicios y horarios (§11.1).
      </p>
      <VistaCatalogo
        sedeId={sedeId}
        especialidades={especialidades ?? []}
        medicos={medicos ?? []}
        vinculos={vinculos ?? []}
        consultorios={consultorios ?? []}
      />
    </div>
  );
}
