import Link from "next/link";
import { validarEnlaceMagico } from "@/lib/enlaces-magicos/enlaces-magicos";
import { listarCitasPorContactoId } from "@/lib/citas/listar-publicas";
import { ListaMisCitas } from "./_componentes/lista-mis-citas";

export default async function PaginaMisCitasToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contactoId = await validarEnlaceMagico(token);

  if (!contactoId) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="mb-2 text-[20px] font-semibold text-text">Enlace vencido</h1>
        <p className="text-[14.5px] text-text-muted">
          Este enlace ya no es válido — expiran a las 24 horas por seguridad. Solicita uno nuevo en{" "}
          <Link href="/mis-citas" className="underline">
            /mis-citas
          </Link>
          .
        </p>
      </div>
    );
  }

  const citas = await listarCitasPorContactoId(contactoId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Mis citas</h1>
      <p className="mb-5 text-[14.5px] text-text-muted">Puedes cancelar o reprogramar tus citas activas.</p>
      <ListaMisCitas token={token} citas={citas} />
    </div>
  );
}
