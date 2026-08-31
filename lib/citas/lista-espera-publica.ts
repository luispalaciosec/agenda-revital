import "server-only";
import { z } from "zod";
import { crearClienteServicio } from "@/lib/supabase/service-role";

const EsquemaListaEsperaPublica = z.object({
  pacienteId: z.string().uuid(),
  especialidadId: z.string().uuid(),
  medicoId: z.string().uuid().nullable().optional(),
  fechaDeseada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** POST /api/v1/lista-espera (§6.1) — el paciente ya debe existir (POST /pacientes primero). */
export async function agregarAListaEsperaPublica(entradaCruda: z.infer<typeof EsquemaListaEsperaPublica>) {
  const entrada = EsquemaListaEsperaPublica.parse(entradaCruda);
  const supabase = crearClienteServicio();

  const { data: vinculo, error: errorVinculo } = await supabase
    .from("contacto_paciente")
    .select("contacto_id")
    .eq("paciente_id", entrada.pacienteId)
    .limit(1)
    .maybeSingle();
  if (errorVinculo) throw errorVinculo;
  if (!vinculo) throw new Error("Este paciente no tiene un contacto vinculado. Regístralo primero con POST /pacientes.");

  const { data, error } = await supabase
    .from("lista_espera")
    .insert({
      especialidad_id: entrada.especialidadId,
      medico_id: entrada.medicoId ?? null,
      paciente_id: entrada.pacienteId,
      contacto_id: vinculo.contacto_id,
      fecha_deseada: entrada.fechaDeseada,
      estado: "esperando",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}
