import "server-only";
import { z } from "zod";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { aLocal } from "@/lib/disponibilidad/tiempo";
import { resolverContactoVerificado, crearPacienteConConsentimientos } from "./contacto-paciente-publico";
import { dispararEventoAgendamiento } from "@/lib/analitica/eventos";

const EsquemaPacienteNuevo = z.object({
  tipoDocumento: z.enum(["cedula", "pasaporte"]),
  documento: z.string().min(5),
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  correo: z.string().email().optional().or(z.literal("")),
  representanteDocumento: z.string().optional(),
  representanteNombres: z.string().optional(),
  representanteParentesco: z.string().optional(),
});

const EsquemaAtribucion = z.object({
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  fbclid: z.string().optional(),
  gclid: z.string().optional(),
  ttclid: z.string().optional(),
  referrer: z.string().optional(),
});

const EsquemaCrearCitaPublica = z.object({
  canal: z.enum(["bot", "web"]),
  celular: z.string().min(7),
  especialidadId: z.string().uuid(),
  medicoId: z.string().uuid().nullable(),
  consultorioId: z.string().uuid().nullable(),
  servicioId: z.string().uuid(),
  inicio: z.string(),
  fin: z.string(),
  pacienteId: z.string().uuid().optional(),
  pacienteNuevo: EsquemaPacienteNuevo.optional(),
  consentimientoMarketing: z.boolean().default(false),
  atribucion: EsquemaAtribucion.optional(),
});

export type EntradaCrearCitaPublica = z.infer<typeof EsquemaCrearCitaPublica>;

/**
 * Crea una cita desde el bot o la web (§6, §7) — sin sesión de panel, con
 * el service role. El contacto debe llegar ya verificado: el bot lo da
 * por hecho (escribió desde su número), la web lo verifica con OTP antes
 * de llamar esta función.
 *
 * El estado inicial sigue §6.3: una consulta confirma de punta a punta;
 * un procedimiento (servicio.requiere_aprobacion) queda 'solicitada' para
 * que una admisionista lo apruebe, salvo que el interruptor
 * `bot_confirma_procedimientos` esté encendido.
 */
export async function crearCitaPublica(entradaCruda: EntradaCrearCitaPublica) {
  const entrada = EsquemaCrearCitaPublica.parse(entradaCruda);
  const supabase = crearClienteServicio();

  const { data: sede, error: errorSede } = await supabase.from("sedes").select("id").limit(1).single();
  if (errorSede || !sede) throw new Error("No hay sede configurada");

  const { data: servicio, error: errorServicio } = await supabase
    .from("servicios")
    .select("id, requiere_aprobacion, agendable")
    .eq("id", entrada.servicioId)
    .single();
  if (errorServicio || !servicio) throw new Error("Servicio no encontrado");
  if (!servicio.agendable) throw new Error("Este servicio no está disponible para agendar en línea");

  // 1. Contacto — ya verificado por el bot (su propio número) o por el OTP
  // de la web, así que se marca verificado=true en ambos casos.
  const contactoId = await resolverContactoVerificado(supabase, entrada.celular);

  // 2. Paciente — existente (buscado antes en el flujo) o nuevo.
  let pacienteId: string;
  if (entrada.pacienteId) {
    pacienteId = entrada.pacienteId;
  } else if (entrada.pacienteNuevo) {
    pacienteId = await crearPacienteConConsentimientos(
      supabase,
      contactoId,
      entrada.pacienteNuevo,
      entrada.canal,
      entrada.consentimientoMarketing
    );
  } else {
    throw new Error("Falta identificar al paciente");
  }

  // 3. Precio vigente (PVP/promocional — lo único visible fuera del panel, §7.3).
  const { data: filasPrecio, error: errorPrecio } = await supabase.rpc("precio_vigente_servicio", {
    p_servicio_id: entrada.servicioId,
  });
  if (errorPrecio) throw errorPrecio;
  const precioVigente = filasPrecio?.[0];
  if (!precioVigente) throw new Error("Este servicio no tiene un precio PVP cargado todavía");

  // 4. Estado inicial (§6.3).
  let estadoInicial: "solicitada" | "confirmada" = "confirmada";
  if (servicio.requiere_aprobacion) {
    const { data: interruptor } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "bot_confirma_procedimientos")
      .single();
    estadoInicial = interruptor?.valor === true ? "confirmada" : "solicitada";
  }

  // 5. Capacidad real de la franja y el índice de cupo, con reintento ante
  // choque de otro request tomando el mismo cupo (motor de cupos, §4.2).
  const local = aLocal(new Date(entrada.inicio));
  let horariosQuery = supabase
    .from("horarios")
    .select("cupos_por_bloque")
    .eq("especialidad_id", entrada.especialidadId)
    .eq("dia_semana", local.diaSemana)
    .eq("activo", true)
    .lte("hora_inicio", local.hora)
    .gt("hora_fin", local.hora);
  horariosQuery = entrada.medicoId ? horariosQuery.eq("medico_id", entrada.medicoId) : horariosQuery.is("medico_id", null);

  const { data: horarios, error: errorHorarios } = await horariosQuery.limit(1);
  if (errorHorarios) throw errorHorarios;
  const capacidad = horarios?.[0]?.cupos_por_bloque ?? 1;

  const atribucion = entrada.atribucion;

  for (let indiceCupo = 1; indiceCupo <= capacidad; indiceCupo++) {
    const { data: cita, error } = await supabase
      .from("citas")
      .insert({
        sede_id: sede.id,
        paciente_id: pacienteId,
        contacto_id: contactoId,
        especialidad_id: entrada.especialidadId,
        servicio_id: entrada.servicioId,
        medico_id: entrada.medicoId,
        consultorio_id: entrada.consultorioId,
        inicio: entrada.inicio,
        fin: entrada.fin,
        indice_cupo: indiceCupo,
        estado: estadoInicial,
        canal: entrada.canal,
        precio_aplicado: precioVigente.precio,
        lista_precio_id: precioVigente.lista_precio_id,
        utm_source: atribucion?.utmSource || null,
        utm_medium: atribucion?.utmMedium || null,
        utm_campaign: atribucion?.utmCampaign || null,
        utm_content: atribucion?.utmContent || null,
        utm_term: atribucion?.utmTerm || null,
        fbclid: atribucion?.fbclid || null,
        gclid: atribucion?.gclid || null,
        ttclid: atribucion?.ttclid || null,
        referrer: atribucion?.referrer || null,
      })
      .select("id, codigo_publico, estado")
      .single();

    if (!error) {
      if (estadoInicial === "solicitada") {
        const { data: venceEn } = await supabase.rpc("sumar_horas_laborables", {
          p_desde: new Date().toISOString(),
          p_horas: 6,
          p_sede_id: sede.id,
        });
        await supabase.from("solicitudes_gestion").insert({ cita_id: cita.id, vence_en: venceEn ?? new Date().toISOString() });
        await supabase.from("notificaciones").insert({
          cita_id: cita.id,
          paciente_id: pacienteId,
          canal: "whatsapp",
          tipo: "aviso_interno",
          plantilla: "aviso:solicitud_por_gestionar",
          estado: "pendiente",
          programada_para: new Date().toISOString(),
        });
      } else {
        // Confirmación por WhatsApp y correo (§9.1: "Al confirmar: WhatsApp + correo").
        await supabase.from("notificaciones").insert([
          { cita_id: cita.id, paciente_id: pacienteId, canal: "whatsapp", tipo: "confirmacion", estado: "pendiente", programada_para: new Date().toISOString() },
          { cita_id: cita.id, paciente_id: pacienteId, canal: "correo", tipo: "confirmacion", estado: "pendiente", programada_para: new Date().toISOString() },
        ]);
        await supabase.from("notificaciones").insert({
          cita_id: cita.id,
          paciente_id: pacienteId,
          canal: "whatsapp",
          tipo: "aviso_interno",
          plantilla: "aviso:cita_nueva",
          estado: "pendiente",
          programada_para: new Date().toISOString(),
        });
        await dispararEventoAgendamiento(cita.id);
      }
      return cita;
    }
    if (error.code === "23505") continue;
    throw error;
  }

  throw new Error("Esa franja ya no tiene cupos disponibles. Elige otro horario.");
}
