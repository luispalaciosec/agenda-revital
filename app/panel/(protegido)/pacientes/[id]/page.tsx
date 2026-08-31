import { notFound } from "next/navigation";
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoHora } from "@/lib/formato";
import { BadgeEstado } from "../../agenda/_componentes/badge-estado";
import { EditorPaciente } from "./_componentes/editor-paciente";

export default async function PaginaDetallePaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .select(
      "id, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, correo, historia_clinica, contador_no_show, representante_nombres, representante_documento"
    )
    .eq("id", id)
    .single();

  if (error || !paciente) notFound();

  const [{ data: vinculos }, { data: citas }, { data: consentimientos }] = await Promise.all([
    supabase.from("contacto_paciente").select("contacto:contactos(id, celular)").eq("paciente_id", id),
    supabase
      .from("citas")
      .select(
        `id, codigo_publico, inicio, estado,
         especialidad:especialidades(nombre),
         servicio:servicios(descripcion)`
      )
      .eq("paciente_id", id)
      .order("inicio", { ascending: false })
      .limit(15),
    supabase
      .from("consentimientos")
      .select("tipo, otorgado, otorgado_en")
      .eq("paciente_id", id)
      .order("otorgado_en", { ascending: false }),
  ]);

  const consentimientoVigente = (tipo: "tratamiento_datos" | "marketing") =>
    consentimientos?.find((c) => c.tipo === tipo) ?? null;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <Link href="/panel/pacientes" className="mb-3 inline-block text-[13px] text-text-muted hover:text-text">
        ← Volver al buscador
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-text">
            {paciente.nombres} {paciente.apellidos}
          </h1>
          <p className="tabular text-sm text-text-muted">
            {paciente.tipo_documento === "cedula" ? "Cédula" : "Pasaporte"} {paciente.documento}
          </p>
        </div>
        {paciente.contador_no_show >= 3 && (
          <span className="rounded-full bg-danger-bg px-3 py-1 text-[13px] font-medium text-danger">
            {paciente.contador_no_show} no-show — en riesgo
          </span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-5">
          <EditorPaciente
            pacienteId={paciente.id}
            nombres={paciente.nombres}
            apellidos={paciente.apellidos}
            correo={paciente.correo ?? ""}
            historiaClinica={paciente.historia_clinica ?? ""}
          />

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-2 text-[14px] font-semibold text-text">Contacto</h2>
            {vinculos && vinculos.length > 0 ? (
              <ul className="space-y-1">
                {vinculos.map((v) =>
                  v.contacto ? (
                    <li key={v.contacto.id} className="tabular text-[14px] text-text">
                      {v.contacto.celular}
                    </li>
                  ) : null
                )}
              </ul>
            ) : (
              <p className="text-[13px] text-text-muted">Sin celulares vinculados.</p>
            )}
          </section>

          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="mb-2 text-[14px] font-semibold text-text">Consentimientos (§12.2)</h2>
            <ul className="space-y-1.5 text-[13.5px]">
              <li className="flex justify-between">
                <span className="text-text">Tratamiento de datos</span>
                <span className={consentimientoVigente("tratamiento_datos")?.otorgado ? "text-success" : "text-danger"}>
                  {consentimientoVigente("tratamiento_datos")?.otorgado ? "Otorgado" : "Sin registrar"}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-text">Marketing</span>
                <span className="text-text-muted">
                  {consentimientoVigente("marketing")?.otorgado ? "Aceptado" : "No aceptado"}
                </span>
              </li>
            </ul>
          </section>
        </div>

        <section className="rounded-lg border border-line bg-surface">
          <h2 className="border-b border-line bg-surface-sunken px-4 py-2.5 text-[14px] font-semibold text-text">
            Historial de citas
          </h2>
          {citas && citas.length > 0 ? (
            <ul>
              {citas.map((c) => (
                <li key={c.id} className="border-b border-line px-4 py-2.5 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular text-[13px] text-text-muted">{formatoHora(c.inicio)}</span>
                    <BadgeEstado estado={c.estado} />
                  </div>
                  <p className="text-[13.5px] text-text">{c.servicio?.descripcion ?? c.especialidad?.nombre}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-[13.5px] text-text-muted">Sin citas registradas.</p>
          )}
        </section>
      </div>
    </div>
  );
}
