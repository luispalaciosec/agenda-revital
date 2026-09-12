import Link from "next/link";
import { buscarPacientes } from "@/lib/citas/buscar-pacientes-lista";
import { exigirRol } from "@/lib/seguridad/exigir-rol";

export default async function PaginaPacientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigirRol(["admin", "supervisor", "admisionista", "medico"]);
  const { q } = await searchParams;
  const resultados = q ? await buscarPacientes(q) : [];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Pacientes</h1>
      <p className="mb-5 text-sm text-text-muted">Buscador por cédula, nombre o celular (§8.2).</p>

      <form method="get" className="mb-5 flex max-w-md gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cédula, nombre o celular…"
          className="h-10 flex-1 rounded-md border border-line-strong bg-surface px-3 text-[14.5px] text-text placeholder:text-text-muted"
          autoFocus
        />
        <button type="submit" className="h-10 rounded-md bg-navy px-4 text-sm font-medium text-text-inverse hover:bg-navy-deep">
          Buscar
        </button>
      </form>

      {q && resultados.length === 0 && (
        <p className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[14px] text-text-muted">
          No hay pacientes que coincidan con &ldquo;{q}&rdquo;.
        </p>
      )}

      {resultados.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <ul>
            {resultados.map((p) => (
              <li key={p.id} className="border-b border-line last:border-b-0">
                <Link
                  href={`/panel/pacientes/${p.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-sunken"
                >
                  <span className="min-w-[180px] flex-1 text-[14px] font-medium text-text">
                    {p.nombres} {p.apellidos}
                  </span>
                  <span className="tabular text-[13px] text-text-muted">{p.documento}</span>
                  {p.contadorNoShow >= 3 && (
                    <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11.5px] font-medium text-danger">
                      {p.contadorNoShow} no-show
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
