import Script from "next/script";
import { crearClienteServicio } from "@/lib/supabase/service-role";

/**
 * GTM/GA4 (§10.1, Fase 6) solo en las páginas públicas — nunca en el
 * panel, para no mandar el uso interno del staff a ninguna plataforma
 * publicitaria. Sin `gtm_container_id` configurado, no se carga ningún
 * script de analítica.
 */
export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  const supabase = crearClienteServicio();
  const { data } = await supabase.from("configuracion").select("valor").eq("clave", "gtm_container_id").maybeSingle();
  const contenedorGtm = typeof data?.valor === "string" ? data.valor : null;

  return (
    <>
      {contenedorGtm && (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${contenedorGtm}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${contenedorGtm}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm"
            />
          </noscript>
        </>
      )}
      {children}
    </>
  );
}
