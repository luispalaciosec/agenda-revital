import "server-only";
import { z } from "zod";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import { resolverContactoVerificado, crearPacienteConConsentimientos } from "./contacto-paciente-publico";

const EsquemaRegistrarPaciente = z.object({
  canal: z.enum(["bot", "web"]),
  tipoDocumento: z.enum(["cedula", "pasaporte"]),
  documento: z.string().min(5),
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  correo: z.string().email().optional().or(z.literal("")),
  celular: z.string().min(7),
  representanteDocumento: z.string().optional(),
  representanteNombres: z.string().optional(),
  representanteParentesco: z.string().optional(),
  consentimientoTratamientoDatos: z.boolean(),
  consentimientoMarketing: z.boolean().default(false),
});

export type EntradaRegistrarPacientePublico = z.infer<typeof EsquemaRegistrarPaciente>;

/** POST /api/v1/pacientes (§6.1) — registra un paciente antes de agendar. */
export async function registrarPacientePublico(entradaCruda: EntradaRegistrarPacientePublico) {
  const entrada = EsquemaRegistrarPaciente.parse(entradaCruda);
  if (!entrada.consentimientoTratamientoDatos) {
    throw new Error("El consentimiento de tratamiento de datos es obligatorio");
  }

  const supabase = crearClienteServicio();
  const contactoId = await resolverContactoVerificado(supabase, entrada.celular);
  const pacienteId = await crearPacienteConConsentimientos(
    supabase,
    contactoId,
    entrada,
    entrada.canal,
    entrada.consentimientoMarketing
  );

  return { pacienteId, contactoId };
}
