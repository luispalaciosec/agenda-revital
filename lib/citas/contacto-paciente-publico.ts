import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export interface DatosPacienteNuevo {
  tipoDocumento: "cedula" | "pasaporte";
  documento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  correo?: string;
  representanteDocumento?: string;
  representanteNombres?: string;
  representanteParentesco?: string;
}

function esMenorDeEdad(fechaNacimiento: string): boolean {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const cumplioEsteAnio =
    hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
    (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() >= nacimiento.getUTCDate());
  return (cumplioEsteAnio ? edad : edad - 1) < 18;
}

/** Contacto verificado (bot: su propio número; web: ya pasó el OTP). */
export async function resolverContactoVerificado(supabase: SupabaseClient<Database>, celular: string): Promise<string> {
  const { data: existente } = await supabase.from("contactos").select("id").eq("celular", celular).maybeSingle();
  if (existente) {
    await supabase
      .from("contactos")
      .update({ verificado: true, verificado_en: new Date().toISOString(), ultimo_acceso: new Date().toISOString() })
      .eq("id", existente.id);
    return existente.id;
  }
  const { data: nuevo, error } = await supabase
    .from("contactos")
    .insert({ celular, verificado: true, verificado_en: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw error;
  return nuevo.id;
}

/** Paciente nuevo + sus dos consentimientos (§12.2) + vínculo N:M con el contacto. */
export async function crearPacienteConConsentimientos(
  supabase: SupabaseClient<Database>,
  contactoId: string,
  datos: DatosPacienteNuevo,
  canal: "web" | "bot",
  consentimientoMarketing: boolean
): Promise<string> {
  const { data: nuevoPaciente, error } = await supabase
    .from("pacientes")
    .insert({
      tipo_documento: datos.tipoDocumento,
      documento: datos.documento,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      fecha_nacimiento: datos.fechaNacimiento,
      correo: datos.correo || null,
      representante_documento: datos.representanteDocumento || null,
      representante_nombres: datos.representanteNombres || null,
      representante_parentesco: datos.representanteParentesco || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  const pacienteId = nuevoPaciente.id;

  const menor = esMenorDeEdad(datos.fechaNacimiento);
  const otorgadoPor = menor ? "representante" : "paciente";
  const representanteDocumento = menor ? datos.representanteDocumento ?? null : null;

  const { error: errorConsentimiento } = await supabase.from("consentimientos").insert([
    {
      paciente_id: pacienteId,
      tipo: "tratamiento_datos",
      otorgado: true,
      version_texto: `${canal}-v1`,
      otorgado_por: otorgadoPor,
      representante_documento: representanteDocumento,
      canal,
    },
    {
      paciente_id: pacienteId,
      tipo: "marketing",
      otorgado: consentimientoMarketing,
      version_texto: `${canal}-v1`,
      otorgado_por: otorgadoPor,
      representante_documento: representanteDocumento,
      canal,
    },
  ]);
  if (errorConsentimiento) throw errorConsentimiento;

  await supabase
    .from("contacto_paciente")
    .upsert({ contacto_id: contactoId, paciente_id: pacienteId }, { onConflict: "contacto_id,paciente_id", ignoreDuplicates: true });

  return pacienteId;
}
