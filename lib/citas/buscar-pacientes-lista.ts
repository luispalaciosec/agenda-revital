import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export interface PacienteResultado {
  id: string;
  tipoDocumento: "cedula" | "pasaporte";
  documento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  correo: string | null;
  contadorNoShow: number;
}

/** Buscador de §8.2: por cédula, nombre o celular. */
export async function buscarPacientes(q: string): Promise<PacienteResultado[]> {
  const termino = q.trim();
  if (!termino) return [];

  const supabase = await crearClienteServidor();
  const columnas = "id, tipo_documento, documento, nombres, apellidos, fecha_nacimiento, correo, contador_no_show";

  const [porDatos, porCelular] = await Promise.all([
    supabase
      .from("pacientes")
      .select(columnas)
      .or(`documento.ilike.%${termino}%,nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%`)
      .order("apellidos")
      .limit(25),
    supabase
      .from("contacto_paciente")
      .select(`paciente:pacientes(${columnas}), contacto:contactos!inner(celular)`)
      .ilike("contacto.celular", `%${termino}%`)
      .limit(25),
  ]);

  const vistos = new Map<string, PacienteResultado>();
  const agregar = (p: {
    id: string;
    tipo_documento: "cedula" | "pasaporte";
    documento: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    correo: string | null;
    contador_no_show: number;
  } | null) => {
    if (!p || vistos.has(p.id)) return;
    vistos.set(p.id, {
      id: p.id,
      tipoDocumento: p.tipo_documento,
      documento: p.documento,
      nombres: p.nombres,
      apellidos: p.apellidos,
      fechaNacimiento: p.fecha_nacimiento,
      correo: p.correo,
      contadorNoShow: p.contador_no_show,
    });
  };

  (porDatos.data ?? []).forEach(agregar);
  (porCelular.data ?? []).forEach((v) => agregar(v.paciente));

  return [...vistos.values()].sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"));
}
