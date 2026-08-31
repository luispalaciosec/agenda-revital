# Prompts por sesión — Claude Code

Copiá y pegá cada bloque al iniciar la sesión correspondiente. **Una sesión nueva por fase**: no arrastres una conversación de seis horas.

Claude Code lee `CLAUDE.md` solo, en cada sesión. No hace falta que se lo pidas.

---

## Antes de empezar

```bash
cd agenda-revital
git init
git add . && git commit -m "Documentación base del proyecto"
claude
```

---

## Sesión 1 — Esquema de base de datos

```
Lee docs/ESPECIFICACION.md completo antes de escribir nada.

Construye la Fase 1 del §14:

1. Proyecto Next.js 15 con App Router, TypeScript y Tailwind
2. Conexión a Supabase
3. Migraciones con todas las tablas del §3
4. Políticas RLS en todas las tablas
5. Tabla de auditoría inmutable: política que solo permite INSERT
6. Tipos TypeScript generados desde el esquema

No construyas interfaz todavía. Cuando termines, muéstrame el diagrama
de relaciones y explicame las decisiones de diseño que tomaste.
```

**⚠️ Pará acá y revisá el esquema antes de continuar.** Es el único momento donde leer con calma te ahorra días. Un error en el modelo de datos se arrastra a todo lo demás.

```bash
git add . && git commit -m "Esquema de base de datos, RLS y auditoría"
```

---

## Sesión 2 — Semilla y motor de disponibilidad

```
Lee docs/ESPECIFICACION.md.

Parte A — Semilla:
- 1 sede con el horario del §4.4
- 7 consultorios
- Las especialidades del §5 con su modo, duración y cupos
- Los médicos de la tabla del §5 y sus horarios
- Las 5 especialidades sin médico del §5.1, con visible_web=false
- Las 593 filas del tarifario desde docs/plantillas/, con agendable=false
  salvo las consultas, ecografía, rayos X y procedimientos cardiológicos
- Los 6 grupos de laboratorio del §3.2

Parte B — Motor de disponibilidad:
Implementa el algoritmo del §4.2 con pruebas unitarias que cubran
TODAS las reglas del §4.3. Incluye pruebas para:
- Bloque de 3 cupos que rechaza el cuarto paciente
- Feriado y ausencia que eliminan franjas
- Anticipación mínima de 3 horas
- Horario del centro como techo del horario del médico
- Dos solicitudes simultáneas sobre el mismo cupo

El motor es el corazón del sistema. Prefiero que tarde más y esté bien.
```

```bash
git add . && git commit -m "Semilla del catálogo y motor de disponibilidad"
```

---

## Sesión 3 — Panel, parte 1

```
Lee docs/ESPECIFICACION.md y docs/TOKENS_DISENO.md.

Construye la Fase 2 del §14, puntos 4 a 8:
- Autenticación con Supabase y los roles del §8.1
- MFA obligatorio para admin
- Agenda del día y agenda semanal (§8.2)
- Crear, cancelar y reprogramar cita
- Pacientes y contactos, con la separación del §3.1
- Validación de cédula ecuatoriana con dígito verificador
- Sala de espera con marcado de llegada

Aplicá la densidad de panel del §6 de los tokens: cuerpo 16px,
botones de 40px, superficies neutras.
```

```bash
git add . && git commit -m "Panel: agenda, citas, pacientes y sala de espera"
```

---

## Sesión 4 — Panel, parte 2

```
Lee docs/ESPECIFICACION.md.

Termina la Fase 2, puntos 9 a 13:
- Cola de solicitudes por gestionar, con SLA de 6 horas visible
- Cancelación masiva del día de un médico (§4.5)
- Catálogo editable: especialidades, médicos, horarios, consultorios,
  servicios con buscador sobre las 593 filas
- Pantalla de configuración con todas las claves del §11.1
  y los interruptores del §11.2
- Historial de configuración con opción de revertir (§11.3)
- Reportes del §8.4 y exportación completa a Excel
- Botón "Copiar datos para el ERP" (§8.3)

Respetá la matriz de permisos del §8.1: las admisionistas no tocan
precios, convenios, textos legales ni integraciones.
```

```bash
git add . && git commit -m "Panel: solicitudes, catálogo, configuración y reportes"
```

---

## Sesión 5 — API para el bot

```
Lee docs/ESPECIFICACION.md.

Construye la Fase 3, los endpoints del §6.1:
- Autenticación por API key en header, con llaves por consumidor
- Idempotencia en POST /citas con header Idempotency-Key
- Bloqueo transaccional para que dos personas no tomen el mismo cupo
- Rate limiting por API key
- El comportamiento del §6.3: consultas confirmadas, procedimientos
  en estado solicitada, con el interruptor bot_confirma_procedimientos

Al terminar, generá un documento en docs/API.md con el contrato
completo, ejemplos de request y response, y los códigos de error.
Lo necesito para configurar Jelou.
```

```bash
git add . && git commit -m "API v1 para el bot de WhatsApp"
```

---

## Sesión 6 — Web pública

```
Lee docs/ESPECIFICACION.md y docs/TOKENS_DISENO.md completo.

Construye la Fase 4:
- Flujo de 3 pantallas del §7.1
- OTP por WhatsApp con las reglas del §7.2
- Los dos consentimientos del §12.2, el de marketing desmarcado
- Portal /mis-citas con link mágico (§7.5)
- Botón de texto grande del §8 de los tokens

Aplicá la densidad de web pública: cuerpo 18px, botones de 48px,
área táctil mínima de 44px. El público incluye adultos mayores.

Un solo elemento con color saturado por pantalla: el botón que
continúa el flujo.
```

```bash
git add . && git commit -m "Web pública de agendamiento"
```

---

## Sesión 7 — Automatizaciones

```
Lee docs/ESPECIFICACION.md.

Construye la Fase 5:
- Recordatorios programados del §9.1: confirmación, 24h y 3h
- Botones interactivos de WhatsApp, no "responde 1" (§9.2)
- Lista de espera con ventana de 30 minutos al primero
- No-show automático al cierre del día
- Vencimiento de solicitudes a las 6 horas laborables
- Encuesta post-cita solo a quien asistió
- Avisos internos del §9.3

Usá cron jobs de Vercel. Todos los tiempos se leen de configuracion,
ninguno fijo en código.
```

```bash
git add . && git commit -m "Recordatorios, lista de espera y automatizaciones"
```

---

## Sesión 8 — Analítica

```
Lee docs/ESPECIFICACION.md.

Construye la Fase 6:
- Eventos server-side a Meta CAPI, Google Ads API y TikTok Events API
- SIN especialidad ni servicio en el payload. Solo evento genérico
  y valor. Ver §10.2, es obligatorio.
- Captura de utm_*, fbclid, gclid, ttclid y referrer en cada cita
- GA4 y Google Tag Manager en el frontend
```

```bash
git add . && git commit -m "Analítica y atribución server-side"
```

---

## Sesión 9 — Verificación final

```
Lee docs/ESPECIFICACION.md.

Recorré uno por uno los criterios de aceptación del §15 y verificá
cada uno con una prueba. Mostrame cuáles pasan y cuáles no.

Después revisá:
- Que ninguna tabla quedó sin RLS
- Que la auditoría no acepta UPDATE ni DELETE
- Que la service role key no se expone al cliente
- Que la app funciona en pantalla de celular
- Que el foco de teclado es visible en todo elemento navegable
```

---

## Recordatorios de operación

**Antes de producción:**
- [ ] Textos legales LOPDP redactados y revisados (§12.5) — es lo único que bloquea
- [ ] Logo en SVG con fondo transparente
- [ ] Supabase en plan Pro, no gratuito (§2.1)
- [ ] Primera semana con pacientes de prueba, no reales (§2.4)

**Tarea de marketing, no de desarrollo:**
- [ ] Repuntar los anuncios click-to-WhatsApp de Meta al número WABA nuevo
- [ ] Verificar tarifas de mensajería con Jelou
- [ ] Conseguir médico para Cardiología
