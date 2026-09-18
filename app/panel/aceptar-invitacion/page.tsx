"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { crearClienteNavegador } from "@/lib/supabase/client";
import isotipo from "@/app/assets/favicon.png";

type EstadoConfirmacion = "revisando" | "por_confirmar" | "confirmando" | "confirmado" | "error";

/**
 * El enlace de invitación NO apunta directo al endpoint de Supabase que
 * consume el token (eso hace que escáneres de seguridad de Gmail/Outlook
 * "abran" el correo y quemen el enlace antes de que la persona lo toque).
 * Apunta aquí con `token_hash` en la URL, y solo lo canjeamos cuando la
 * persona hace clic en "Confirmar invitación" -- un bot que solo hace GET
 * nunca dispara ese clic.
 */
function FormularioAceptarInvitacion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") || "invite";

  const [estado, setEstado] = useState<EstadoConfirmacion>(tokenHash ? "por_confirmar" : "revisando");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Compatibilidad con enlaces ya generados antes de este cambio (flujo
    // anterior por fragmento #access_token, que el cliente ya procesó solo).
    if (tokenHash) return;
    (async () => {
      const supabase = crearClienteNavegador();
      const { data } = await supabase.auth.getUser();
      setEstado(data.user ? "confirmado" : "error");
    })();
  }, [tokenHash]);

  async function confirmarInvitacion() {
    if (!tokenHash) return;
    setEstado("confirmando");
    const supabase = crearClienteNavegador();
    const { error: errorVerificar } = await supabase.auth.verifyOtp({
      type: tipo as "invite" | "email" | "recovery" | "magiclink",
      token_hash: tokenHash,
    });
    setEstado(errorVerificar ? "error" : "confirmado");
  }

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    const supabase = crearClienteNavegador();
    const { error: errorActualizar } = await supabase.auth.updateUser({ password: contrasena });
    setEnviando(false);

    if (errorActualizar) {
      setError("No se pudo completar el registro. Pide que te reenvíen la invitación.");
      return;
    }

    router.push("/panel/agenda");
    router.refresh();
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image src={isotipo} alt="Revital" className="mx-auto mb-3 h-14 w-14" priority />
          <h1 className="text-[22px] font-semibold text-text">Agenda Revital</h1>
          <p className="mt-1 text-sm text-text-muted">
            {estado === "confirmado" ? "Crea tu contraseña para entrar al panel" : "Acepta tu invitación al panel"}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow">
          {estado === "revisando" && <p className="text-center text-sm text-text-muted">Revisando tu enlace…</p>}

          {(estado === "por_confirmar" || estado === "confirmando") && (
            <div className="text-center">
              <p className="mb-4 text-sm text-text-muted">Confirma que quieres aceptar esta invitación para continuar.</p>
              <button
                type="button"
                onClick={confirmarInvitacion}
                disabled={estado === "confirmando"}
                className="h-10 w-full rounded-md bg-navy text-sm font-medium text-text-inverse transition-colors hover:bg-navy-deep disabled:opacity-60"
              >
                {estado === "confirmando" ? "Confirmando…" : "Confirmar invitación"}
              </button>
            </div>
          )}

          {estado === "error" && (
            <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-center text-sm text-danger">
              Este enlace ya expiró o ya fue usado. Pide que te reenvíen la invitación.
            </p>
          )}

          {estado === "confirmado" && (
            <form onSubmit={manejarEnvio} className="space-y-4">
              <div>
                <label htmlFor="contrasena" className="mb-1.5 block text-sm font-medium text-text">
                  Contraseña
                </label>
                <input
                  id="contrasena"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-text"
                />
              </div>

              <div>
                <label htmlFor="confirmacion" className="mb-1.5 block text-sm font-medium text-text">
                  Confirma la contraseña
                </label>
                <input
                  id="confirmacion"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-text"
                />
              </div>

              {error && (
                <p role="alert" aria-live="polite" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="h-10 w-full rounded-md bg-navy text-sm font-medium text-text-inverse transition-colors hover:bg-navy-deep disabled:opacity-60"
              >
                {enviando ? "Guardando…" : "Entrar al panel"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PaginaAceptarInvitacion() {
  return (
    <Suspense fallback={null}>
      <FormularioAceptarInvitacion />
    </Suspense>
  );
}
