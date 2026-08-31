import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface EntradaListaEspera {
  especialidadId: string;
  medicoId: string | null;
  celular: string;
  pacienteId?: string;
  pacienteNuevo?: {
    tipoDocumento: "cedula" | "pasaporte";
    documento: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: string;
  };
  fechaDeseada: string;
}

export async function agregarAListaEspera(entrada: EntradaListaEspera) {
  const supabase = await crearClienteServidor();

  let contactoId: string;
  const { data: contactoExistente } = await supabase.from("contactos").select("id").eq("celular", entrada.celular).maybeSingle();
  if (contactoExistente) {
    contactoId = contactoExistente.id;
  } else {
    const { data: nuevoContacto, error } = await supabase
      .from("contactos")
      .insert({ celular: entrada.celular, verificado: true, verificado_en: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw error;
    contactoId = nuevoContacto.id;
  }

  let pacienteId: string;
  if (entrada.pacienteId) {
    pacienteId = entrada.pacienteId;
  } else if (entrada.pacienteNuevo) {
    const p = entrada.pacienteNuevo;
    const { data: nuevoPaciente, error } = await supabase
      .from("pacientes")
      .insert({
        tipo_documento: p.tipoDocumento,
        documento: p.documento,
        nombres: p.nombres,
        apellidos: p.apellidos,
        fecha_nacimiento: p.fechaNacimiento,
      })
      .select("id")
      .single();
    if (error) throw error;
    pacienteId = nuevoPaciente.id;
  } else {
    throw new Error("Falta identificar al paciente");
  }

  await supabase
    .from("contacto_paciente")
    .upsert({ contacto_id: contactoId, paciente_id: pacienteId }, { onConflict: "contacto_id,paciente_id", ignoreDuplicates: true });

  const { error } = await supabase.from("lista_espera").insert({
    especialidad_id: entrada.especialidadId,
    medico_id: entrada.medicoId,
    paciente_id: pacienteId,
    contacto_id: contactoId,
    fecha_deseada: entrada.fechaDeseada,
    estado: "esperando",
  });
  if (error) throw error;
}

/** Notificación real (WhatsApp) es Fase 5; acá solo se registra el estado. */
export async function marcarNotificado(id: string) {
  const supabase = await crearClienteServidor();

  const { data: config } = await supabase.from("configuracion").select("valor").eq("clave", "lista_espera_ventana_minutos").single();
  const minutos = typeof config?.valor === "number" ? config.valor : 30;

  const { error } = await supabase
    .from("lista_espera")
    .update({
      estado: "notificado",
      notificado_en: new Date().toISOString(),
      expira_en: new Date(Date.now() + minutos * 60 * 1000).toISOString(),
    })
    .eq("id", id)
    .eq("estado", "esperando");
  if (error) throw error;
}

export async function marcarEstadoListaEspera(id: string, estado: "tomado" | "cancelado" | "expirado") {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("lista_espera").update({ estado }).eq("id", id);
  if (error) throw error;
}
