import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { crearClienteServicio } from "@/lib/supabase/service-role";
import logo from "@/app/assets/logo.png";

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
      <div className="flex min-h-full flex-col">
        <header className="bg-surface">
          <div className="mx-auto flex h-[72px] max-w-3xl items-center px-4 sm:px-6">
            <Link href="/agendar" className="inline-flex items-center" aria-label="Revital Centros Médicos">
              <Image src={logo} alt="Revital Centros Médicos" priority className="h-9 w-auto sm:h-10" />
            </Link>
          </div>
          <div className="flex h-1" aria-hidden="true">
            <span className="flex-1 bg-navy" />
            <span className="flex-1 bg-green" />
            <span className="flex-1 bg-teal" />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
