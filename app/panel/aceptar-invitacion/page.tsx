"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { crearClienteNavegador } from "@/lib/supabase/client";
import isotipo from "@/app/assets/favicon.png";

export default function PaginaAceptarInvitacion() {
  const router = useRouter();
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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
          <p className="mt-1 text-sm text-text-muted">Crea tu contraseña para entrar al panel</p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4 rounded-lg border border-line bg-surface p-6 shadow">
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
      </div>
    </main>
  );
}
