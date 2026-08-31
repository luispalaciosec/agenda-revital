import { crearClienteServicio } from "@/lib/supabase/service-role";
import { listarEspecialidadesPublicas } from "@/lib/catalogo/publico";
import { AsistenteAgendar } from "./_componentes/asistente-agendar";

export default async function PaginaAgendar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = crearClienteServicio();
  const { data: config } = await supabase
    .from("configuracion")
    .select("clave, valor")
    .in("clave", ["canal_web_activo", "modo_mantenimiento"]);
  const mapa = new Map((config ?? []).map((c) => [c.clave, c.valor]));

  if (mapa.get("modo_mantenimiento") === true) {
    return <MensajeCentro titulo="En mantenimiento" texto="Estamos actualizando el sistema. Vuelve a intentar en unos minutos." />;
  }
  if (mapa.get("canal_web_activo") !== true) {
    return (
      <MensajeCentro
        titulo="Agenda en línea no disponible"
        texto="Por ahora no podemos agendar por este medio. Llámanos o escríbenos por WhatsApp."
      />
    );
  }

  const especialidades = await listarEspecialidadesPublicas("web");
  const parametros = await searchParams;
  const atribucion = {
    utmSource: comoTexto(parametros.utm_source),
    utmMedium: comoTexto(parametros.utm_medium),
    utmCampaign: comoTexto(parametros.utm_campaign),
    utmContent: comoTexto(parametros.utm_content),
    utmTerm: comoTexto(parametros.utm_term),
    fbclid: comoTexto(parametros.fbclid),
    gclid: comoTexto(parametros.gclid),
    ttclid: comoTexto(parametros.ttclid),
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <header className="mb-6 text-center">
        <p className="text-[13px] font-medium uppercase tracking-wide text-teal-deep">Revital Centros Médicos</p>
        <h1 className="mt-1 text-[26px] font-semibold text-text">Agenda tu cita</h1>
      </header>
      <AsistenteAgendar especialidades={especialidades} atribucion={atribucion} />
    </div>
  );
}

function comoTexto(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor || undefined;
}

function MensajeCentro({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-[20px] font-semibold text-text">{titulo}</h1>
      <p className="text-[14.5px] text-text-muted">{texto}</p>
    </div>
  );
}
