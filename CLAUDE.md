# Agenda Revital

Sistema de agendamiento de citas médicas para Revital Centros Médicos, Guayaquil, Ecuador.

Tres superficies sobre un solo backend: web pública, panel de admisionistas y API consumida por un bot de WhatsApp en Jelou.

## Documentación

**Antes de escribir código, lee el documento que corresponda.**

| Documento | Cuándo leerlo |
|---|---|
| `docs/ESPECIFICACION.md` | Modelo de datos, reglas de negocio, endpoints, permisos, orden de construcción. **Es la fuente única de verdad.** |
| `docs/TOKENS_DISENO.md` | Antes de construir cualquier interfaz. Colores, tipografía, componentes, accesibilidad. |

Si algo no está en esos documentos, pregunta antes de asumir.

## Stack

Next.js 15 (App Router) · TypeScript · Supabase (Postgres, Auth, RLS) · Tailwind · Vercel

Sin backend separado. Los route handlers de Next.js son el API.

## Reglas que no se negocian

1. **Configurable sobre programado.** Si un dato puede cambiar sin cambiar la lógica, va en la tabla `configuracion` y se edita desde el panel. Nunca fijo en código.

2. **Sin datos clínicos.** El sistema guarda qué servicio se agendó. Nunca síntomas, diagnósticos ni motivos de consulta. No existe campo "motivo".

3. **Esta base es el único registro de las citas.** El ERP de Revital no tiene API. Auditoría inmutable, respaldos y exportación a Excel son obligatorios.

4. **Los eventos publicitarios nunca incluyen la especialidad.** Enviar "agendó Ginecología" a Meta o Google es transmitir un dato de salud. Solo evento genérico + valor.

5. **Fechas en UTC en la base, `America/Guayaquil` en pantalla.** La conversión ocurre en presentación.

6. **Toda validación en el servidor.** Disponibilidad, precios y permisos nunca se confían al cliente.

7. **RLS activo en todas las tablas.** Sin excepción.

8. **Contraste mínimo 4.5:1.** El verde y el turquesa de marca no se usan para texto ni botones; para eso están las variantes oscurecidas de `TOKENS_DISENO.md`.

## Orden de construcción

Ver §14 de la especificación. Resumen:

1. Esquema, RLS, auditoría, semilla del catálogo
2. Motor de disponibilidad con pruebas
3. Panel de admisionistas
4. API `/api/v1` para el bot
5. Web pública y OTP
6. Automatizaciones (recordatorios, lista de espera, no-show)
7. Analítica server-side

## Convenciones

- Nombres de tablas, columnas y rutas en **español**, igual que en la especificación.
- Interfaz en español de Ecuador.
- Commits en español, descriptivos.
- Cada regla de negocio del §4 necesita una prueba.
