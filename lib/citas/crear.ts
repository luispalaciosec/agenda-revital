import "server-only";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { aLocal } from "@/lib/disponibilidad/tiempo";

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

const EsquemaCrearCita = z.object({
  especialidadId: z.string().uuid(),
  medicoId: z.string().uuid().nullable(),
  consultorioId: z.string().uuid().nullable(),
  servicioId: z.string().uuid(),
  inicio: z.string(),
  fin: z.string(),
  celular: z.string().min(7),
  pacienteId: z.string().uuid().optional(),
  pacienteNuevo: EsquemaPacienteNuevo.optional(),
  consentimientoMarketing: z.boolean().default(false),
  notaAdmision: z.string().optional(),
});

export type EntradaCrearCita = z.infer<typeof EsquemaCrearCita>;

function esMenorDeEdad(fechaNacimiento: string): boolean {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const cumplioEsteAnio =
    hoy.getUTCMonth() > nacimiento.getUTCMonth() ||
    (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() >= nacimiento.getUTCDate());
  return (cumplioEsteAnio ? edad : edad - 1) < 18;
}

/**
 * Crea una cita desde el panel. Siempre queda 'confirmada' (§1: el panel
 * no pasa por solicitud, ya hay una admisionista coordinando). Toda
 * validación real vive acá, del lado del servidor (§6.2, §13) — el
 * cliente solo propone.
 */
export async function crearCitaPanel(entradaCruda: EntradaCrearCita) {
  const entrada = EsquemaCrearCita.parse(entradaCruda);
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: sede, error: errorSede } = await supabase.from("sedes").select("id").limit(1).single();
  if (errorSede || !sede) throw new Error("No hay sede configurada");

  // 1. Contacto (celular) — se reusa si ya existe.
  let contactoId: string;
  {
    const { data: existente } = await supabase
      .from("contactos")
      .select("id")
      .eq("celular", entrada.celular)
      .maybeSingle();
    if (existente) {
      contactoId = existente.id;
    } else {
      const { data: nuevo, error } = await supabase
        .from("contactos")
        .insert({ celular: entrada.celular, verificado: true, verificado_en: new Date().toISOString() })
        .select("id")
        .single();
      if (error) throw error;
      contactoId = nuevo.id;
    }
  }

  // 2. Paciente — existente (buscado antes en el flujo) o nuevo.
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
        correo: p.correo || null,
        representante_documento: p.representanteDocumento || null,
        representante_nombres: p.representanteNombres || null,
        representante_parentesco: p.representanteParentesco || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    pacienteId = nuevoPaciente.id;

    // Consentimientos (§12.2): obligatorio de tratamiento de datos, marketing
    // desmarcado salvo que el paciente lo haya aceptado en el mostrador.
    const menor = esMenorDeEdad(p.fechaNacimiento);
    const otorgadoPor = menor ? "representante" : "paciente";
    const representanteDocumento = menor ? p.representanteDocumento ?? null : null;

    const { error: errorConsentimiento } = await supabase.from("consentimientos").insert([
      {
        paciente_id: pacienteId,
        tipo: "tratamiento_datos",
        otorgado: true,
        version_texto: "panel-v1",
        otorgado_por: otorgadoPor,
        representante_documento: representanteDocumento,
        canal: "panel",
      },
      {
        paciente_id: pacienteId,
        tipo: "marketing",
        otorgado: entrada.consentimientoMarketing,
        version_texto: "panel-v1",
        otorgado_por: otorgadoPor,
        representante_documento: representanteDocumento,
        canal: "panel",
      },
    ]);
    if (errorConsentimiento) throw errorConsentimiento;
  } else {
    throw new Error("Falta identificar al paciente");
  }

  // 3. Vincular contacto-paciente (N:M, §3.1) si todavía no estaban ligados.
  await supabase
    .from("contacto_paciente")
    .upsert({ contacto_id: contactoId, paciente_id: pacienteId }, { onConflict: "contacto_id,paciente_id", ignoreDuplicates: true });

  // 4. Precio vigente del servicio (función puntual: admisionista no tiene
  // acceso de lectura a la tabla precios, solo al monto ya resuelto).
  const { data: filasPrecio, error: errorPrecio } = await supabase.rpc("precio_vigente_servicio", {
    p_servicio_id: entrada.servicioId,
  });
  if (errorPrecio) throw errorPrecio;
  const precioVigente = filasPrecio?.[0];
  if (!precioVigente) throw new Error("Este servicio no tiene un precio PVP cargado todavía");

  // 5. Capacidad real de la franja (horarios es la fuente de verdad, no la
  // franja que mandó el cliente) y el índice de cupo, con reintento ante
  // choque de otro request tomando el mismo cupo (§ acuerdo del índice
  // único anti-sobrecupo).
  const local = aLocal(new Date(entrada.inicio));
  let horariosQuery = supabase
    .from("horarios")
    .select("cupos_por_bloque")
    .eq("especialidad_id", entrada.especialidadId)
    .eq("dia_semana", local.diaSemana)
    .eq("activo", true)
    .lte("hora_inicio", local.hora)
    .gt("hora_fin", local.hora);
  horariosQuery = entrada.medicoId
    ? horariosQuery.eq("medico_id", entrada.medicoId)
    : horariosQuery.is("medico_id", null);

  const { data: horarios, error: errorHorarios } = await horariosQuery.limit(1);
  if (errorHorarios) throw errorHorarios;
  const capacidad = horarios?.[0]?.cupos_por_bloque ?? 1;

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
        estado: "confirmada",
        canal: "panel",
        precio_aplicado: precioVigente.precio,
        lista_precio_id: precioVigente.lista_precio_id,
        nota_admision: entrada.notaAdmision || null,
        creado_por: user.id,
      })
      .select("id, codigo_publico")
      .single();

    if (!error) return cita;
    if (error.code === "23505") continue; // cupo tomado por otro request, probar el siguiente índice
    throw error;
  }

  throw new Error("Esa franja ya no tiene cupos disponibles. Elige otro horario.");
}
