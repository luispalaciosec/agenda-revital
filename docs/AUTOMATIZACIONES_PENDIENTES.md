# Fase 5 y 6 — qué falta para producción

Lo construido funciona de punta a punta usando adaptadores de desarrollo (WhatsApp, correo, Meta/Google/TikTok quedan en el log del servidor). Antes de lanzar, falta conectar credenciales reales — cada punto de abajo señala exactamente qué archivo tocar.

## Envío real

- **WhatsApp**: `lib/notificaciones/proveedor-whatsapp.ts` — reemplazar `ProveedorDesarrollo` por el cliente de Jelou (o el proveedor que se use), usando `process.env`.
- **Correo**: `lib/notificaciones/proveedor-correo.ts` — mismo patrón, con el proveedor SMTP/API que se elija.
- **Botones interactivos del recordatorio de 24h** (§9.2, "Sí, voy a ir" / "Necesito cambiarla"): hoy el texto los menciona como respuesta esperada, pero son texto plano — los botones reales son una plantilla aprobada por Meta y una capacidad específica del proveedor de WhatsApp (Jelou). Se activan configurando esa plantilla ahí, no aquí.
- **Meta / Google / TikTok**: `lib/analitica/proveedor-conversion.ts` — reemplazar las tres clases `*Desarrollo` por las llamadas reales a Conversions API, Google Ads API y TikTok Events API.

## Cadencia del cron

`vercel.json` programa `/api/internal/cron` cada 15 minutos. **El plan Hobby de Vercel solo permite cron jobs una vez al día** — con esa cadencia los recordatorios de 3 horas prácticamente no tienen margen para disparar a tiempo. Necesita el plan Pro (ya se decidió Supabase Pro por la misma razón de que esta base es el único registro de las citas del centro).

`CRON_SECRET` debe configurarse como variable de entorno en Vercel — sin ella, el endpoint se abre en desarrollo pero se cierra por completo en producción.

## Preferencias de notificación por usuario

§9.3 menciona que "cada usuario puede además configurar su propio correo y celular en su perfil, y elegir qué avisos recibe". Hoy los avisos internos (cita nueva, solicitud por gestionar, solicitud próxima a vencer, cancelación del paciente) van todos al mismo destino de respaldo (`notificaciones_whatsapp_respaldo` / `notificaciones_correo_respaldo` en Configuración) — no hay UI ni columnas todavía para que cada admisionista elija sus propios avisos. Es una mejora de UI sobre una base que ya funciona, no un bloqueante.

## Encuesta post-cita

El mensaje pide una calificación del 1 al 5 por WhatsApp, pero no hay una página ni un webhook que reciba y guarde esa respuesta — hoy es una notificación de salida únicamente. Capturar la respuesta requeriría un endpoint que reciba mensajes entrantes de Jelou (fuera del alcance de "agendar citas").
