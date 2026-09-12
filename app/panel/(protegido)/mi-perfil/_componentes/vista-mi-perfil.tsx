"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { accionActualizarMiPerfil, accionActualizarMiFoto } from "../_acciones";
import type { MiPerfil } from "@/lib/usuarios/mi-perfil";

const ETIQUETAS_ROL: Record<string, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  admisionista: "Admisión",
  medico: "Médico",
};

const clasesCampo = "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[14.5px] text-text";
const clasesEtiqueta = "mb-1.5 block text-[13px] font-medium text-text";

export function VistaMiPerfil({ perfil }: { perfil: MiPerfil }) {
  const router = useRouter();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [nombres, setNombres] = useState(perfil.nombres);
  const [apellidos, setApellidos] = useState(perfil.apellidos);
  const [correo, setCorreo] = useState(perfil.correo);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [mensajeDatos, setMensajeDatos] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [guardandoContrasena, setGuardandoContrasena] = useState(false);
  const [mensajeContrasena, setMensajeContrasena] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function guardarDatos() {
    if (!nombres.trim() || !apellidos.trim() || !correo.trim()) {
      setMensajeDatos({ tipo: "error", texto: "Nombres, apellidos y correo son obligatorios." });
      return;
    }
    setGuardandoDatos(true);
    setMensajeDatos(null);

    const correoCambio = correo.trim() !== perfil.correo;
    if (correoCambio) {
      const supabase = crearClienteNavegador();
      const { error } = await supabase.auth.updateUser({ email: correo.trim() });
      if (error) {
        setGuardandoDatos(false);
        setMensajeDatos({ tipo: "error", texto: "No se pudo iniciar el cambio de correo: " + error.message });
        return;
      }
    }

    const resultado = await accionActualizarMiPerfil({ nombres: nombres.trim(), apellidos: apellidos.trim(), correo: correo.trim() });
    setGuardandoDatos(false);
    if (!resultado.ok) {
      setMensajeDatos({ tipo: "error", texto: resultado.mensaje });
      return;
    }
    setMensajeDatos({
      tipo: "ok",
      texto: correoCambio
        ? "Guardado. Revisa tu correo nuevo y confirma el cambio desde el enlace que te llegó."
        : "Guardado.",
    });
    router.refresh();
  }

  async function subirFoto(archivo: File) {
    setSubiendoFoto(true);
    setErrorFoto(null);

    const extension = archivo.name.split(".").pop() ?? "jpg";
    const ruta = `${perfil.authUserId}/foto-${Date.now()}.${extension}`;

    const supabase = crearClienteNavegador();
    const { error: errorSubida } = await supabase.storage.from("avatars").upload(ruta, archivo, { upsert: true });
    if (errorSubida) {
      setSubiendoFoto(false);
      setErrorFoto("No se pudo subir la foto: " + errorSubida.message);
      return;
    }

    const { data: publica } = supabase.storage.from("avatars").getPublicUrl(ruta);
    const resultado = await accionActualizarMiFoto(publica.publicUrl);
    setSubiendoFoto(false);
    if (!resultado.ok) {
      setErrorFoto(resultado.mensaje);
      return;
    }
    router.refresh();
  }

  async function guardarContrasena() {
    if (nuevaContrasena.length < 8) {
      setMensajeContrasena({ tipo: "error", texto: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      setMensajeContrasena({ tipo: "error", texto: "Las contraseñas no coinciden." });
      return;
    }
    setGuardandoContrasena(true);
    setMensajeContrasena(null);

    const supabase = crearClienteNavegador();
    const { error } = await supabase.auth.updateUser({ password: nuevaContrasena });
    setGuardandoContrasena(false);
    if (error) {
      setMensajeContrasena({ tipo: "error", texto: "No se pudo cambiar la contraseña: " + error.message });
      return;
    }
    setNuevaContrasena("");
    setConfirmarContrasena("");
    setMensajeContrasena({ tipo: "ok", texto: "Contraseña actualizada." });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-3 text-[15px] font-semibold text-text">Foto y datos</h2>

        <div className="mb-4 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-sunken">
            {perfil.fotoUrl ? (
              <Image src={perfil.fotoUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[18px] font-semibold text-text-muted">
                {perfil.nombres.charAt(0)}
                {perfil.apellidos.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) void subirFoto(archivo);
              }}
            />
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={subiendoFoto}
              className="h-9 rounded-md border border-line-strong px-3 text-[13px] font-medium text-text hover:bg-surface-sunken disabled:opacity-60"
            >
              {subiendoFoto ? "Subiendo…" : "Cambiar foto"}
            </button>
            <p className="mt-1 text-[12px] text-text-muted">{ETIQUETAS_ROL[perfil.rol] ?? perfil.rol}</p>
            {errorFoto && <p className="mt-1 text-[12px] text-danger">{errorFoto}</p>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={clasesEtiqueta}>Nombres</label>
            <input className={clasesCampo} value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </div>
          <div>
            <label className={clasesEtiqueta}>Apellidos</label>
            <input className={clasesCampo} value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={clasesEtiqueta}>Correo</label>
            <input type="email" className={clasesCampo} value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
        </div>

        {mensajeDatos && (
          <p className={`mt-3 text-[13px] ${mensajeDatos.tipo === "error" ? "text-danger" : "text-success"}`}>{mensajeDatos.texto}</p>
        )}

        <button
          type="button"
          onClick={guardarDatos}
          disabled={guardandoDatos}
          className="mt-4 h-9 rounded-md bg-navy px-4 text-[13px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-60"
        >
          {guardandoDatos ? "Guardando…" : "Guardar cambios"}
        </button>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <h2 className="mb-3 text-[15px] font-semibold text-text">Cambiar contraseña</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={clasesEtiqueta}>Nueva contraseña</label>
            <input
              type="password"
              autoComplete="new-password"
              className={clasesCampo}
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
            />
          </div>
          <div>
            <label className={clasesEtiqueta}>Confirmar</label>
            <input
              type="password"
              autoComplete="new-password"
              className={clasesCampo}
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
            />
          </div>
        </div>
        {mensajeContrasena && (
          <p className={`mt-3 text-[13px] ${mensajeContrasena.tipo === "error" ? "text-danger" : "text-success"}`}>{mensajeContrasena.texto}</p>
        )}
        <button
          type="button"
          onClick={guardarContrasena}
          disabled={guardandoContrasena}
          className="mt-4 h-9 rounded-md border border-line-strong px-4 text-[13px] font-medium text-text hover:bg-surface-sunken disabled:opacity-60"
        >
          {guardandoContrasena ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </section>
    </div>
  );
}
