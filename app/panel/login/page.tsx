"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

export default function PaginaLogin() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });

    setEnviando(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/panel/agenda");
    router.refresh();
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-navy text-lg font-semibold text-text-inverse">
            R
          </div>
          <h1 className="text-[22px] font-semibold text-text">Agenda Revital</h1>
          <p className="mt-1 text-sm text-text-muted">Entra con tu cuenta del panel</p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4 rounded-lg border border-line bg-surface p-6 shadow">
          <div>
            <label htmlFor="correo" className="mb-1.5 block text-sm font-medium text-text">
              Correo
            </label>
            <input
              id="correo"
              type="email"
              required
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-text placeholder:text-text-muted"
              placeholder="nombre@revitalcentrosmedicos.com"
            />
          </div>

          <div>
            <label htmlFor="contrasena" className="mb-1.5 block text-sm font-medium text-text">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              required
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
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
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
