"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  accionInvitarUsuario,
  accionActualizarRolUsuario,
  accionActualizarFlagActivoUsuario,
  accionActualizarMedicoUsuario,
} from "../_acciones";
import { formatoFechaDMY } from "@/lib/formato";
import type { Database } from "@/lib/supabase/database.types";
import type { DatosInvitacion } from "@/lib/usuarios/gestionar";

type RolUsuario = Database["public"]["Enums"]["rol_usuario_enum"];

interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string | null;
  rol: RolUsuario;
  activo: boolean;
  ultimo_acceso: string | null;
  creado_en: string;
  medico_id: string | null;
  medico: { nombres: string; apellidos: string } | null;
}

interface MedicoParaVincular {
  id: string;
  nombres: string;
  apellidos: string;
}

const clasesCampo =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[13.5px] text-text placeholder:text-text-muted";
const clasesEtiqueta = "mb-1 block text-[12.5px] font-medium text-text";

const ETIQUETAS_ROL: Record<RolUsuario, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  admisionista: "Admisión",
  medico: "Médico",
};

const ROLES_ASIGNABLES: RolUsuario[] = ["admin", "supervisor", "admisionista", "medico"];

const FORMULARIO_VACIO: DatosInvitacion = {
  correo: "",
  nombres: "",
  apellidos: "",
  rol: "admisionista",
  medicoId: null,
};

export function VistaUsuarios({
  usuarios,
  medicos,
  idUsuarioActual,
}: {
  usuarios: Usuario[];
  medicos: MedicoParaVincular[];
  idUsuarioActual: string;
}) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<DatosInvitacion>(FORMULARIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMensaje, setOkMensaje] = useState<string | null>(null);

  async function invitar() {
    if (!form.correo.trim() || !form.nombres.trim() || !form.apellidos.trim()) {
      setError("Correo, nombres y apellidos son obligatorios.");
      return;
    }
    if (form.rol === "medico" && !form.medicoId) {
      setError("Elige a qué médico corresponde este acceso.");
      return;
    }
    setEnviando(true);
    setError(null);
    const resultado = await accionInvitarUsuario(form);
    setEnviando(false);
    if (resultado.ok) {
      setForm(FORMULARIO_VACIO);
      setMostrarForm(false);
      setOkMensaje(`Invitación enviada a ${form.correo}.`);
      router.refresh();
    } else {
      setError(resultado.mensaje);
    }
  }

  async function cambiarRol(id: string, rol: RolUsuario) {
    await accionActualizarRolUsuario(id, rol);
    router.refresh();
  }

  async function cambiarMedico(id: string, medicoId: string) {
    await accionActualizarMedicoUsuario(id, medicoId || null);
    router.refresh();
  }

  async function alternarActivo(u: Usuario) {
    await accionActualizarFlagActivoUsuario(u.id, !u.activo);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-text">Personas con acceso al panel</h2>
        {!mostrarForm && (
          <button
            type="button"
            onClick={() => {
              setMostrarForm(true);
              setOkMensaje(null);
            }}
            className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep"
          >
            + Invitar persona
          </button>
        )}
      </div>

      {okMensaje && <p className="mb-3 rounded-md bg-success-bg px-3 py-2 text-[13px] text-success">{okMensaje}</p>}

      {mostrarForm && (
        <div className="mb-4 rounded-lg border border-line bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={clasesEtiqueta}>Nombres</label>
              <input className={clasesCampo} value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
            </div>
            <div>
              <label className={clasesEtiqueta}>Apellidos</label>
              <input className={clasesCampo} value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={clasesEtiqueta}>Correo</label>
              <input
                type="email"
                className={clasesCampo}
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                placeholder="nombre@revitalcentrosmedicos.com"
              />
            </div>
            <div>
              <label className={clasesEtiqueta}>Rol</label>
              <select
                className={clasesCampo}
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value as RolUsuario, medicoId: null })}
              >
                {ROLES_ASIGNABLES.map((r) => (
                  <option key={r} value={r}>
                    {ETIQUETAS_ROL[r]}
                  </option>
                ))}
              </select>
            </div>
            {form.rol === "medico" && (
              <div>
                <label className={clasesEtiqueta}>Médico vinculado</label>
                <select
                  className={clasesCampo}
                  value={form.medicoId ?? ""}
                  onChange={(e) => setForm({ ...form, medicoId: e.target.value || null })}
                >
                  <option value="">Elige un médico…</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombres} {m.apellidos}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={invitar}
              disabled={enviando}
              className="h-9 rounded-md bg-navy px-3.5 text-[13px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar invitación"}
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="h-9 rounded-md border border-line-strong px-3.5 text-[13px] font-medium text-text hover:bg-surface-sunken"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {usuarios.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-text-muted">No hay usuarios todavía.</p>
        ) : (
          <ul>
            {usuarios.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 text-[13.5px] last:border-b-0">
                <div className="min-w-[200px] flex-1">
                  <p className="font-medium text-text">
                    {u.nombres} {u.apellidos}
                    {u.id === idUsuarioActual && <span className="ml-1.5 text-[12px] font-normal text-text-muted">(tú)</span>}
                  </p>
                  <p className="text-[12.5px] text-text-muted">
                    {u.correo} · Invitado {formatoFechaDMY(u.creado_en)}
                  </p>
                </div>
                <select
                  className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[12.5px] text-text disabled:opacity-50"
                  value={u.rol}
                  disabled={u.id === idUsuarioActual}
                  onChange={(e) => cambiarRol(u.id, e.target.value as RolUsuario)}
                >
                  {ROLES_ASIGNABLES.includes(u.rol) ? null : <option value={u.rol}>{ETIQUETAS_ROL[u.rol]}</option>}
                  {ROLES_ASIGNABLES.map((r) => (
                    <option key={r} value={r}>
                      {ETIQUETAS_ROL[r]}
                    </option>
                  ))}
                </select>
                {u.rol === "medico" && (
                  <select
                    className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[12.5px] text-text"
                    value={u.medico_id ?? ""}
                    onChange={(e) => cambiarMedico(u.id, e.target.value)}
                  >
                    <option value="">Sin vincular</option>
                    {medicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombres} {m.apellidos}
                      </option>
                    ))}
                  </select>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    u.activo ? "bg-success-bg text-success" : "bg-surface-sunken text-text-muted"
                  }`}
                >
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
                {u.id !== idUsuarioActual && (
                  <button
                    type="button"
                    onClick={() => alternarActivo(u)}
                    className="h-8 rounded-md border border-line-strong px-2.5 text-[12.5px] font-medium text-text hover:bg-surface-sunken"
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
