"use client";

import { useState } from "react";
import Link from "next/link";
import { accionSolicitarEnlaceMagico } from "./_acciones";

export default function PaginaMisCitas() {
  const [celular, setCelular] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [tokenDev, setTokenDev] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    const r = await accionSolicitarEnlaceMagico(celular);
    setEnviando(false);
    if (r.ok) {
      setEnviado(true);
      setTokenDev(r.tokenDev);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Mis citas</h1>
      <p className="mb-5 text-[14.5px] text-text-muted">
        Escribe el número de WhatsApp con el que agendaste. Te enviamos un enlace para ver, cancelar o reprogramar tus citas.
      </p>

      {enviado ? (
        <div className="rounded-md bg-success-bg px-4 py-3 text-[14px] text-text">
          Si ese número tiene citas registradas, te enviamos el enlace por WhatsApp. Válido por 24 horas.
          {tokenDev && (
            <p className="mt-2 rounded-md bg-warning-bg px-3 py-2 text-[12.5px]">
              Modo desarrollo: <Link className="underline" href={`/mis-citas/${tokenDev}`}>abrir enlace ahora</Link>.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="09XXXXXXXX"
            className="tabular h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-text placeholder:text-text-muted"
          />
          <button
            type="button"
            disabled={enviando || celular.trim().length < 7}
            onClick={enviar}
            className="h-11 w-full rounded-md bg-navy text-[15px] font-medium text-text-inverse hover:bg-navy-deep disabled:opacity-40"
          >
            {enviando ? "Enviando…" : "Enviar enlace"}
          </button>
        </div>
      )}
    </div>
  );
}
