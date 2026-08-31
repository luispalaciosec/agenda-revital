# AGENDA REVITAL — Especificación Maestra

**Versión:** 1.0
**Fecha:** 30 de agosto de 2026
**Autor funcional:** Luis Palacios Castro — Marketing Manager, Revital Centros Médicos
**Destinatario:** Claude Code
**Estado:** Listo para construcción. Los puntos marcados `[PENDIENTE]` no bloquean el desarrollo; se cargan desde el panel una vez desplegado.

---

## 0. Cómo usar este documento

Este archivo es la fuente única de verdad del proyecto. Si algo no está aquí, no se construye sin preguntar.

**Tres reglas que gobiernan todas las decisiones:**

1. **Configurable sobre programado.** Si un dato puede cambiar sin cambiar la lógica, va en base de datos y se edita desde el panel. Cada valor fijo en código es una llamada a un programador dentro de seis meses.
2. **La app es la fuente de verdad.** El ERP de Revital no tiene API ni conexión. Esta base de datos es el único registro de las citas del centro. Respaldos, auditoría y exportación no son opcionales.
3. **Sin datos clínicos.** El sistema guarda qué servicio se agendó (dato comercial). Nunca guarda síntomas, diagnósticos ni motivos de consulta. Eso vive en el ERP.

---

## 1. Contexto del negocio

**Revital Centros Médicos** es un centro médico multiespecialidad en C.C. Olímpico, Av. Kennedy, Guayaquil, Ecuador. Ofrece 12+ especialidades, laboratorio propio con 450+ tipos de análisis, imágenes y procedimientos.

**El problema que resuelve este sistema:** hoy el agendamiento depende de conversaciones de WhatsApp atendidas manualmente por un equipo de 3 admisionistas. Las campañas de Meta Ads generan volumen de conversaciones que excede la capacidad de atención, y las conversaciones no atendidas convierten cerca de cero. El centro además quiere salir de su ERP actual, que no tiene conexión web.

**Los tres canales de entrada:**

| Canal | Quién agenda | Estado inicial de la cita |
|---|---|---|
| Web pública | El paciente, solo | Confirmada (consultas) / Solicitada (procedimientos) |
| Bot de WhatsApp (Jelou) | El paciente vía bot | Confirmada (consultas) / Solicitada (procedimientos) |
| Panel de admisionistas | Las 3 admisionistas | Confirmada |

**Nombre del producto visible al paciente:** Agenda Revital

---

## 2. Stack y arquitectura

### 2.1 Decisión técnica

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend + Backend | **Next.js 15 (App Router), TypeScript** | Un solo despliegue. Los route handlers son endpoints HTTP reales; no hace falta un backend separado. |
| Base de datos | **Supabase (Postgres) — plan Pro** | Postgres administrado, Auth, RLS y respaldos automáticos. El plan gratuito no tiene respaldos automáticos y pausa el proyecto tras 7 días sin actividad: inaceptable cuando esta base es el único registro de las citas. |
| Hosting | **Vercel** | Misma empresa que Next.js. Preview automático por rama. |
| Estilos | **Tailwind CSS** | |
| API | **REST sobre route handlers** | Se evaluó FastAPI + GraphQL y se descartó: duplicaría despliegues y lenguajes sin aportar nada para 3 consumidores que piden los mismos datos. |

**Un solo backend, tres consumidores:** la web pública, el panel y el bot de Jelou consumen los mismos endpoints.

### 2.2 Estructura de rutas

```
/                       Web pública de agendamiento
/mis-citas              Portal del paciente (acceso por link mágico)
/panel                  Panel de admisionistas y admin
/api/v1/*               API pública consumida por Jelou
/api/internal/*         API del panel (protegida por sesión Supabase)
```

### 2.3 Zona horaria

- Toda fecha/hora se **almacena en UTC** (`timestamptz`).
- Toda fecha/hora se **presenta en `America/Guayaquil`** (UTC-5, sin horario de verano).
- La conversión ocurre en la capa de presentación, nunca en la base.

### 2.4 Ambientes

No hay ambiente de staging separado, por decisión de urgencia del cliente.

**Mitigación obligatoria:**
- Los preview deployments de Vercel por rama se usan para toda prueba (son automáticos y gratuitos).
- **La primera semana en producción se opera con pacientes de prueba.** Recién validado el flujo completo entran citas reales.
- Modo mantenimiento disponible desde el día 1 (ver §11).

---

## 3. Modelo de datos

### 3.1 Principio de separación contacto / paciente

**Crítico.** Un celular puede agendar para varias personas (una madre agenda a sus tres hijos). Por eso:

- **`contactos`** = el número de WhatsApp que agenda.
- **`pacientes`** = la persona que se atiende, identificada por cédula.
- **`contacto_paciente`** = relación N:M.

El historial de no-show, el límite de citas activas y la cobertura de convenio se cargan al **paciente**, nunca al teléfono.

### 3.2 Tablas

#### Estructura organizacional

```sql
sedes (
  id, nombre, direccion, telefono, activa,
  hora_apertura_lv, hora_cierre_lv,
  hora_apertura_sab, hora_cierre_sab,
  zona_horaria default 'America/Guayaquil'
)
-- Hoy existe una sola sede, pero se modela desde el día 1.
-- Toda entidad operativa cuelga de sede_id.

consultorios (
  id, sede_id, nombre, numero, activo
)
-- 7 consultorios en la sede actual.

especialidades (
  id, sede_id, nombre, slug, descripcion_publica,
  modo enum('exacto','bloque','solicitud'),
  duracion_min, cupos_por_bloque default 1,
  requiere_aprobacion boolean,
  visible_web boolean, visible_bot boolean,
  orden_visualizacion, activa
)
-- visible_web/visible_bot se calculan: una especialidad sin médico
-- activo asignado NO aparece al público, aunque esté activa.

medicos (
  id, sede_id, nombres, apellidos, titulo,
  cedula, celular, correo,
  consultorio_default_id, activo
)

medico_especialidad (
  medico_id, especialidad_id
)
-- N:M. Un médico puede atender varias especialidades.
```

#### Horarios y disponibilidad

```sql
horarios (
  id, medico_id, especialidad_id, consultorio_id,
  dia_semana smallint,        -- 1=lunes ... 7=domingo
  hora_inicio time, hora_fin time,
  modo enum('exacto','bloque'),
  duracion_min, cupos_por_bloque,
  vigente_desde date, vigente_hasta date,
  activo
)
-- Plantilla semanal recurrente. Un médico puede tener varias filas.

excepciones_agenda (
  id, tipo enum('feriado','vacaciones','ausencia','bloqueo'),
  alcance enum('sede','medico','consultorio'),
  medico_id null, consultorio_id null, sede_id null,
  fecha_desde, fecha_hasta,
  hora_desde null, hora_fin null,   -- null = día completo
  motivo, creado_por, creado_en
)
-- Cubre feriados nacionales, vacaciones, enfermedad y bloqueos puntuales.
```

#### Catálogo de servicios

```sql
servicios (
  id, sede_id, codigo_revital, tipo, descripcion,
  especialidad_id null,
  agendable boolean default false,
  duracion_min null,             -- si null, hereda de la especialidad
  requiere_aprobacion boolean,
  preparacion_previa text null,  -- ej: "Ayuno de 8 horas"
  visible_web, visible_bot, activo
)
-- Se carga el tarifario completo (593 filas). Solo un subconjunto
-- arranca con agendable=true. El admin puede marcar cualquiera
-- desde el panel, con buscador.

servicios_agrupados (
  id, nombre, servicios_ids[], especialidad_id, duracion_min
)
-- Para laboratorio: el paciente agenda "Sangre" u "Orina",
-- no uno de los 453 análisis. El detalle se define en el centro.
```

**Ítems agendables de laboratorio (confirmados):** Sangre, Orina, Heces, Papanicolau, Cultivos, Hormonal.

#### Precios

```sql
listas_precio (
  id, nombre, tipo enum('pvp','promocional','aseguradora','convenio'),
  descuento_pct null, vigente_desde, vigente_hasta, activa
)

precios (
  id, lista_precio_id, servicio_id, valor
)

aseguradoras (
  id, nombre, descuento_pct, requiere_autorizacion_previa boolean,
  activa
)
-- CRUD completo desde el panel.

convenios (
  id, nombre, ruc_empresa, descuento_pct, contacto, activo
)

convenio_beneficiarios (
  id, convenio_id, cedula, nombres, apellidos,
  parentesco enum('TITULAR','CONYUGE','HIJO','PADRE','MADRE','OTRO'),
  vigencia_desde, vigencia_hasta
)
-- Se carga por Excel. Plantilla entregada:
-- PLANTILLA_convenios_Agenda_Revital.xlsx
```

**Reglas de precio:**
- **PVP** es la lista base, viene del tarifario.
- **Promocional** es un tercer precio, más bajo, público para cualquiera, con fecha de inicio y fin por servicio.
- **Aseguradora** y **convenio** tienen su propio descuento, visible **solo en el panel**.
- **Cuando aplican varios, manda siempre el más bajo. Los descuentos nunca se acumulan.**
- El paciente de convenio **declara** que lo tiene; el sistema verifica la cédula contra `convenio_beneficiarios`.

#### Pacientes y contactos

```sql
contactos (
  id, celular unique, verificado boolean, verificado_en,
  creado_en, ultimo_acceso
)

pacientes (
  id, tipo_documento enum('cedula','pasaporte'),
  documento unique, nombres, apellidos,
  fecha_nacimiento, correo null,
  historia_clinica null,          -- opcional, la llena admisión
  representante_documento null,   -- obligatorio si es menor de 18
  representante_nombres null,
  representante_parentesco null,
  contador_no_show int default 0,
  creado_en, actualizado_en
)
-- NO EXISTE campo "motivo de consulta". Decisión deliberada:
-- guardarlo convertiría la base en un repositorio de datos de salud
-- de categoría especial bajo LOPDP.

contacto_paciente (
  contacto_id, paciente_id, relacion, creado_en
)

consentimientos (
  id, paciente_id,
  tipo enum('tratamiento_datos','marketing'),
  otorgado boolean, version_texto,
  ip, user_agent, canal, otorgado_en, revocado_en
)
-- DOS consentimientos separados:
--   tratamiento_datos: obligatorio, sin él no se agenda
--   marketing: opcional, desmarcado por defecto
```

#### Citas

```sql
citas (
  id, codigo_publico unique,     -- ej: RVT-8F3K2
  sede_id, paciente_id, contacto_id,
  especialidad_id, servicio_id, medico_id null, consultorio_id null,
  inicio timestamptz, fin timestamptz,
  estado enum(...),              -- ver §4.1
  canal enum('web','bot','panel'),
  precio_aplicado numeric, lista_precio_id,
  aseguradora_id null, convenio_id null,
  nota_admision text null,       -- solo panel, nunca clínica
  llegada_en timestamptz null,
  atendida_en timestamptz null,
  creado_por, creado_en, actualizado_en,
  utm_source, utm_medium, utm_campaign, utm_content, utm_term,
  fbclid, gclid, ttclid, referrer
)

solicitudes_gestion (
  id, cita_id, asignada_a null,
  vence_en timestamptz,          -- 6 horas laborables desde creación
  resuelta_en, resultado enum('aceptada','rechazada','vencida'),
  observacion
)

lista_espera (
  id, especialidad_id, medico_id null, paciente_id, contacto_id,
  fecha_deseada, notificado_en, expira_en, estado
)
-- Cuando se libera un cupo se notifica AL PRIMERO de la lista.
-- Tiene 30 minutos para tomarlo. Si no responde, pasa al siguiente.
```

#### Sistema

```sql
usuarios (
  id, auth_user_id, nombres, apellidos, correo, celular,
  rol enum('admin','admisionista','medico'),
  mfa_habilitado, activo, ultimo_acceso
)
-- El rol 'medico' se modela pero queda DESACTIVADO en v1.

notificaciones (
  id, cita_id null, paciente_id, canal enum('whatsapp','correo'),
  tipo, plantilla, estado, proveedor_id,
  programada_para, enviada_en, error
)

configuracion (
  clave unique, valor jsonb, categoria, descripcion,
  actualizado_por, actualizado_en
)
-- Ver §11 para el catálogo completo de claves.

auditoria (
  id, usuario_id, entidad, entidad_id,
  accion enum('crear','actualizar','eliminar'),
  datos_antes jsonb, datos_despues jsonb,
  ip, user_agent, creado_en
)
-- INMUTABLE. Sin UPDATE ni DELETE. Política RLS que solo permite INSERT.
-- Incluye cambios de configuración, con opción de revertir desde el panel.
```

---

## 4. Reglas de negocio

### 4.1 Ciclo de vida de la cita

```
                    ┌─────────────┐
                    │  solicitada │  (procedimientos, especialidades sin horario)
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │ en_gestion  │  → vence a las 6h laborables
                    └──────┬──────┘
                           ▼
    ┌──────────────────────────────────────────┐
    │              confirmada                   │ ← (consultas: directo aquí)
    └──┬────────────┬────────────┬─────────────┘
       ▼            ▼            ▼
   atendida     no_show    cancelada_paciente
                           cancelada_centro
                           reprogramada
```

**Estados:** `solicitada`, `en_gestion`, `confirmada`, `atendida`, `no_show`, `cancelada_paciente`, `cancelada_centro`, `reprogramada`, `rechazada`.

**Para el paciente, los estados `solicitada`, `en_gestion` y `rechazada` son invisibles.** Solo ve "Estamos coordinando tu cita, te confirmamos pronto".

### 4.2 Motor de cupos

El modelo híbrido se resuelve con dos campos, no con dos sistemas:

| Modo | Duración | Cupos | Comportamiento |
|---|---|---|---|
| `exacto` | 20 min | 1 | Cita a hora fija: 10:20, 10:40, 11:00 |
| `bloque` | 60 min | 3 | Hasta 3 pacientes en el bloque 10:00–11:00, se atiende por orden de llegada |
| `solicitud` | — | — | No genera cupos. Crea una solicitud a gestionar. |

**Algoritmo de disponibilidad:**

1. Tomar los `horarios` vigentes del médico/especialidad para la fecha consultada.
2. Restar las `excepciones_agenda` que apliquen (feriado, vacaciones, ausencia, bloqueo).
3. Recortar contra el horario general de la sede (el horario del centro es techo).
4. Generar franjas según `modo`, `duracion_min` y `cupos_por_bloque`.
5. Descontar las citas ya existentes en estado `confirmada`, `solicitada` o `en_gestion`.
6. Aplicar la anticipación mínima (3 horas) y máxima (60 días).
7. **Si `validar_consultorios` está activo:** descartar franjas cuyo consultorio ya esté ocupado por otro médico. *Este interruptor arranca APAGADO — ver §16.*

### 4.3 Reglas duras

| Regla | Valor | Configurable |
|---|---|---|
| Anticipación mínima para agendar | 3 horas | ✅ |
| Anticipación máxima | 60 días | ✅ |
| **Sobrecupo** | **Prohibido.** No se agrega un 4º paciente a un bloque de 3. | ❌ |
| Agendar fuera del horario publicado | Permitido, solo vía solicitud al médico | ✅ |
| Cancelación sin penalidad | Hasta 4 horas antes | ✅ |
| Reprogramación desde el link | 1 vez | ✅ |
| Citas activas simultáneas por paciente | Máx. 3 | ✅ |
| Dos citas de la misma especialidad el mismo día | Prohibido | ✅ |
| Alerta por no-show reincidente | Al 3er no-show. No bloquea. | ✅ |
| SLA de solicitud en gestión | 6 horas laborables | ✅ |
| Ventana de la lista de espera | 30 minutos | ✅ |
| No-show automático | Al cierre del día, para citas pasadas sin marcar | ✅ |

### 4.4 Horario general del centro

| | Apertura | Cierre |
|---|---|---|
| Lunes a viernes | 07:00 | 17:30 |
| Sábado | 07:30 | 13:00 |
| Domingo y feriados | Cerrado | |

- **07:00** porque el laboratorio abre a esa hora.
- **17:30** porque Psicología atiende 17:00 y necesita margen de cierre.
- **Sin cierre de almuerzo general.** Cada médico marca sus bloqueos individuales; el laboratorio atiende corrido.
- El horario del centro funciona como **techo**: nadie agenda fuera de él aunque el médico tenga horario más amplio.

### 4.5 Cancelación masiva

Cuando un médico falta, el panel debe permitir **cancelar su día completo en una acción**, con notificación automática a todos los pacientes afectados incluyendo link para elegir nueva hora. Sin esta función, la admisionista termina llamando uno por uno.

---

## 5. Catálogo inicial de especialidades

Cargar como semilla. **Todo editable desde el panel.**

| Especialidad | Modo | Duración | Cupos | Horario | Médico |
|---|---|---|---|---|---|
| Medicina general | bloque | 60 min | 3 | Lun–Vie 08:00–17:00 | Dr. John Méndez (8:00–12:30), Dra. Kenny Zambrano (12:30–17:00) |
| Medicina interna | exacto | 30 min | 1 | Mié 15:30–17:00 | Dra. Nyree Jurado |
| Ginecología | exacto | 20 min | 1 | Lun–Vie 14:30–15:30 | Dra. Martha Escobar |
| Traumatología | exacto | 20 min | 1 | Jue 16:00–17:00 | Dr. Aníbal Gonzaga |
| Nutrición | exacto | 30 min | 1 | Lun–Vie 14:30–17:00 | Lcda. Cindy Zambrano |
| Gastroenterología | exacto | 30 min | 1 | Lun–Vie desde 12:30 `[PENDIENTE hora fin]` | Dra. Martha Zambrano |
| Psicología | exacto | 45 min | 1 | Lun–Vie 17:00 | Ps. Diana García |
| Odontología | exacto | 30 min | 1 | Lun–Vie 08:00–17:00 | Od. Solange Montilla (8:00–12:30), Od. Elizabeth Pico (12:30–17:00) |
| Terapia física | exacto | 45 min | 1 | Lun–Vie 08:00–17:00 | Lcda. Verónica Villafuerte |
| Endodoncia | solicitud | 60 min | 1 | — | Dra. Becsy Bravo |
| Cirugía maxilofacial | solicitud | 60 min | 1 | — | Dr. Alberto Tandazo |
| Rehabilitación | solicitud | 45 min | 1 | — | Dr. David Magallanes |
| Urología | solicitud | 20 min | 1 | — | Dr. Óscar González |
| Dermatología | solicitud | 20 min | 1 | — | Dra. Gladys Ramírez |
| Laboratorio | bloque | 30 min | 4 | Lun–Vie 07:00–15:00 | — (sin médico) |
| Rayos X | exacto | 15 min | 1 | Lun–Vie 08:00–17:00 | `[PENDIENTE]` |
| Ecografía | exacto | 20 min | 1 | Lun–Vie 08:00–12:00 | `[PENDIENTE]` |

### 5.1 Especialidades con precio pero sin especialista

Estas tienen código y precio en el tarifario pero **ningún médico asignado**. Se crean en la base con `visible_web = false` y `visible_bot = false`. **Aparecen solas al público en cuanto el admin les asigna un especialista activo.** La funcionalidad completa debe estar construida.

| Especialidad | Código | PVP |
|---|---|---|
| **Cardiología** | CON-CR | $25.00 |
| Pediatría | CON-PD | $20.00 |
| Otorrinolaringología | CON-OTR | $25.00 |
| Oftalmología | CON-OFT | $25.00 |
| Neumología | — (solo procedimiento PNM-ESP) | — |

> ⚠️ **Cardiología es la campaña de Meta Ads con mejor tasa de cierre y menor costo por venta.** Que no tenga médico asignado significa que el mejor ad set del centro apunta a una especialidad que no se puede agendar. Prioridad de negocio para Luis, no de desarrollo.

Lo mismo aplica a los procedimientos cardiológicos, que son de los servicios más caros del tarifario: ecocardiograma ($100), Holter EKG ($75), Holter PA ($75), prueba de esfuerzo ($125).

---

## 6. API pública (`/api/v1`)

Consumida por el bot de Jelou. **Autenticación: API key en header `X-API-Key`.** Cada consumidor tiene su propia llave, revocable de forma independiente sin afectar a los demás.

### 6.1 Endpoints

```http
GET  /api/v1/especialidades
     → [{ id, nombre, slug, duracion_min, modo, requiere_aprobacion }]

GET  /api/v1/medicos?especialidad={slug}
     → [{ id, nombres, apellidos, titulo, especialidades[] }]

GET  /api/v1/disponibilidad?especialidad={slug}&medico={id?}&desde={fecha}&hasta={fecha}
     → [{ fecha, franjas: [{ inicio, fin, cupos_disponibles, medico_id, consultorio_id }] }]

POST /api/v1/pacientes/buscar
     { documento? , celular? }
     → { encontrado, paciente?, pacientes_vinculados[] }

POST /api/v1/pacientes
     { tipo_documento, documento, nombres, apellidos, fecha_nacimiento,
       correo?, celular, representante?, consentimientos: { tratamiento_datos, marketing } }
     → { paciente_id, contacto_id }

POST /api/v1/citas
     { paciente_id, contacto_id, especialidad_id, servicio_id, medico_id?,
       inicio, canal: "bot", atribucion?: { utm_*, fbclid, gclid, ttclid } }
     → { cita_id, codigo_publico, estado, mensaje_para_paciente }

GET  /api/v1/citas/{id}
POST /api/v1/citas/{id}/cancelar      { motivo? }
POST /api/v1/citas/{id}/reprogramar   { nuevo_inicio }

GET  /api/v1/citas?contacto={celular}&estado=activas
     → citas activas del contacto y sus pacientes vinculados

POST /api/v1/lista-espera
     { paciente_id, especialidad_id, medico_id?, fecha_deseada }
```

### 6.2 Reglas del API

- **Idempotencia:** `POST /citas` acepta header `Idempotency-Key`. Reintento con la misma llave devuelve la cita existente, no crea duplicado.
- **Validación de disponibilidad en el servidor.** Nunca se confía en que el cliente verificó el cupo.
- **Bloqueo transaccional al crear cita** para evitar que dos personas tomen el mismo cupo simultáneamente.
- **Rate limiting** por API key.
- El campo `mensaje_para_paciente` devuelve el texto ya redactado según el estado, para que Jelou solo lo repita.

### 6.3 Comportamiento del bot

| Tipo de servicio | Acción del bot |
|---|---|
| **Consultas** | Confirma de punta a punta. Estado `confirmada`. |
| **Procedimientos** | Crea la cita en estado `solicitada`. Una admisionista aprueba. |

**Justificación:** un procedimiento como colposcopia con biopsia, implante subdérmico o prueba de esfuerzo requiere insumos, preparación y a veces material que hay que pedir. Si el bot confirma sin verificar y no hay insumo, el paciente llega y se va molesto.

Para el paciente es invisible: recibe "estamos confirmando tu cita, te avisamos en breve".

> **Interruptor `bot_confirma_procedimientos`** en configuración. Si a los tres meses las admisionistas aprueban el 100% sin cambiar nada, se apaga la aprobación desde el panel. Sin programador.

**Otros comportamientos:**
- El bot **no pide OTP**. El paciente ya escribió desde su número; está verificado por definición.
- Reconoce al contacto y ofrece repetir con el médico anterior.
- Lee el mensaje pre-llenado de los anuncios de Meta y salta directo a esa especialidad, guardando la atribución.
- Handoff a humano disponible **solo en horario laboral** (Lun–Vie 08:00–17:00). Fuera de ese horario informa cuándo responden.

> ⚠️ **Tarea de lanzamiento (no es desarrollo):** el bot corre sobre un número WABA nuevo, distinto del 0958603010. **Los anuncios click-to-WhatsApp de Meta deben repuntarse al número nuevo** o el bot nunca verá los leads.

---

## 7. Web pública

### 7.1 Flujo — máximo 3 pantallas

```
1. ELEGIR       → especialidad → (opcional) médico → fecha → hora
2. IDENTIFICAR  → cédula → si existe, precarga; si no, formulario
                → consentimientos
3. VERIFICAR    → código OTP por WhatsApp → confirmación
```

Cada paso adicional pierde entre 10% y 20% de quienes empiezan.

### 7.2 OTP

- **Solo en la web.** El bot no lo necesita.
- 6 dígitos, válido 10 minutos, máximo 3 intentos.
- Sin esto, cualquiera puede llenar la agenda con citas falsas.
- Rate limiting por IP, invisible para el usuario normal.

> **Nota de costo:** el OTP es un mensaje pagado de categoría autenticación. Cuando el paciente responde, se abre una ventana de servicio de 24 horas en la que los mensajes de utilidad se tarifan distinto. Enviar la confirmación dentro de esa ventana reduce el costo real. **Luis debe verificar las tarifas exactas con Jelou**; el modelo de precios de WhatsApp cambia con frecuencia.

### 7.3 Precios visibles

La web muestra **PVP y precio promocional**. Los precios de aseguradora y convenio son **solo del panel**.

### 7.4 Accesibilidad

Tamaños normales por defecto, con **botón visible de "texto más grande"** que el paciente activa si quiere. La preferencia se guarda en el navegador. No se fuerza por defecto.

### 7.5 Portal del paciente — `/mis-citas`

- Acceso por **link mágico enviado por WhatsApp**. Sin contraseña, sin registro.
- El link expira a las 24 horas.
- Permite ver, cancelar y reprogramar.
- Justificación: los adultos mayores no crean cuentas.

### 7.6 Dominio

Arranca en el subdominio de Vercel. **El dominio se lee de configuración**, nunca fijo en código, para que mover a `citas.revital.ec` sea un registro DNS y una variable de entorno.

---

## 8. Panel

### 8.1 Usuarios y roles

3 admisionistas + 1 admin (Luis). **Un usuario por persona, nunca compartido**: si comparten credenciales, el log de auditoría no sirve para nada.

| Permiso | Admisionista | Admin |
|---|---|---|
| Ver y gestionar citas | ✅ | ✅ |
| Agendar, cancelar, reprogramar | ✅ | ✅ |
| Marcar llegada y atención | ✅ | ✅ |
| Aprobar solicitudes | ✅ | ✅ |
| Crear y editar pacientes | ✅ | ✅ |
| Catálogo: especialidades, médicos, horarios | ✅ | ✅ |
| Ausencias, vacaciones, feriados | ✅ | ✅ |
| Cancelación masiva | ✅ | ✅ |
| **Precios y listas de precio** | ❌ | ✅ |
| **Aseguradoras y convenios** | ❌ | ✅ |
| **Textos legales** | ❌ | ✅ |
| **Plantillas de mensajes** | ❌ | ✅ |
| **Integraciones y API keys** | ❌ | ✅ |
| **Usuarios y roles** | ❌ | ✅ |
| **Exportar / borrar paciente (LOPDP)** | ❌ | ✅ |
| Modo mantenimiento | ❌ | ✅ |

- **MFA obligatorio para admin**, opcional para admisionistas.
- Panel accesible desde cualquier internet, sin restricción por IP: si alguien necesita entrar un sábado desde su casa, un bloqueo la deja afuera.

### 8.2 Vistas

1. **Agenda del día** — vista por defecto. Timeline por médico y por consultorio.
2. **Agenda semanal**
3. **Sala de espera** — quién está en el centro ahora. **La admisionista marca la llegada** al recibir al paciente.
4. **Solicitudes por gestionar** — cola con SLA de 6 horas y contador visible.
5. **Lista de espera**
6. **Pacientes** — buscador por cédula, nombre o celular.
7. **Catálogo** — especialidades, médicos, horarios, servicios, consultorios.
8. **Configuración** — ver §11.
9. **Reportes** — §8.4.

### 8.3 Botón "Copiar datos para el ERP"

**Importante para la adopción.** Las admisionistas van a digitar en dos sistemas mientras Revital sale de su ERP. El panel debe ofrecer un botón que copie al portapapeles un bloque con los datos del paciente y la cita, en formato listo para pegar.

Es un detalle chico que decide si el sistema se usa o se abandona en dos semanas.

### 8.4 Reportes

- Citas por día, semana y mes
- Citas por especialidad y por médico
- **Tasa de no-show**
- **Origen del agendamiento**: web / bot / panel
- Ocupación por médico y por consultorio
- Solicitudes: gestionadas, vencidas, tiempo promedio de resolución
- **Exportación completa a Excel** de cualquier reporte y de toda la base

### 8.5 Mobile-first

El panel se usa desde el celular de admisión tanto como desde la computadora.

---

## 9. Notificaciones

### 9.1 Secuencia por cita

| Momento | Canal | Contenido |
|---|---|---|
| OTP (solo web) | WhatsApp | Código de 6 dígitos |
| Al confirmar | WhatsApp + correo | Confirmación con fecha, hora, médico, dirección, preparación previa si aplica, link a `/mis-citas` |
| 24 h antes | WhatsApp | Recordatorio **con botones tocables** |
| 3 h antes | WhatsApp | Recordatorio final |
| Post-cita (+3 h) | WhatsApp | Encuesta — **solo a quien asistió** |

**Solo 2 recordatorios, no 3.** Decisión de costo. Cada mensaje fuera de la ventana de 24 horas es una plantilla pagada.

### 9.2 Botones, no números

El recordatorio de 24 h usa **botones interactivos de WhatsApp**: "Sí, voy a ir" / "Necesito cambiarla".

Nunca "responde 1 para confirmar". Suena a call center y obliga a interpretar texto libre. Los botones devuelven una respuesta estructurada.

Quien no confirma el de 24 h queda marcado **en riesgo** en el panel.

### 9.3 Notificaciones del centro

- Cita nueva → aviso interno
- Solicitud por gestionar → aviso a las admisionistas
- Solicitud próxima a vencer
- Cancelación del paciente
- Cupo liberado → al primero de la lista de espera, con ventana de 30 minutos

**Destinos de respaldo:**
- Correo: `redes@revitalcentrosmedicos.com`
- WhatsApp: `0967429574`

Cada usuario puede además configurar su propio correo y celular en su perfil, y elegir qué avisos recibe. Los médicos llevan correo y celular en su ficha aunque no entren al sistema en v1.

### 9.4 Límite conocido

**Las plantillas de WhatsApp requieren aprobación de Meta.** Desde el panel se editan las **variables** (nombre, hora, médico) y se elige qué plantilla usar, pero **el texto base se modifica en Jelou y espera revisión de 1 a 24 horas**. No es una limitación del sistema.

---

## 10. Analítica y atribución

### 10.1 Eventos del lado del servidor

Cuando una cita pasa a `confirmada`, el servidor dispara:

| Destino | Evento |
|---|---|
| Meta Conversions API | `Schedule` |
| Google Ads API | conversión offline |
| TikTok Events API | `CompleteRegistration` |

Server-side, no píxel del navegador: más confiable y no depende de bloqueadores.

### 10.2 ⚠️ Sin especialidad — obligatorio

**El evento NUNCA incluye la especialidad ni el servicio.** Solo `AppointmentScheduled` + valor.

Enviar "agendó Ginecología" o "agendó Psicología" a una plataforma publicitaria es transmitir un **dato de salud inferido de una persona identificable** a un tercero. Las políticas de datos sensibles de Meta, Google y TikTok lo prohíben, y bajo LOPDP es dato de categoría especial.

La especialidad se ve en el panel de Revital, que es donde importa.

### 10.3 Atribución capturada

Se guardan en cada cita: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `ttclid`, `referrer`.

También GA4 y Google Tag Manager en el frontend.

---

## 11. Configuración desde el panel

**Principio rector: se configura el CONTENIDO, no la LÓGICA.** Hacer editable la estructura del formulario de pacientes o el flujo de estados vuelve el sistema frágil y cualquiera lo rompe sin darse cuenta.

### 11.1 Todo lo configurable

**Catálogo**
- Crear, editar y desactivar especialidades (crear, no solo activar)
- Crear y editar médicos; asignar varias especialidades a un médico
- **Asignar especialista a una especialidad huérfana** → la vuelve visible al público automáticamente
- Consultorios
- Marcar cualquiera de los 593 servicios del tarifario como agendable, con buscador
- Duración, modo y cupos por especialidad y por horario
- Horarios semanales por médico
- Grupos de laboratorio y su capacidad por franja
- Texto de preparación previa por servicio

**Agenda**
- Horario general del centro
- Feriados
- Vacaciones y ausencias por rango
- Anticipación mínima y máxima
- Ventana de cancelación sin penalidad
- Minutos de la lista de espera
- SLA de solicitudes en gestión
- Hora del cierre automático de no-show
- Límite de citas activas por paciente

**Precios** *(solo admin)*
- PVP, promocional con vigencia, aseguradoras, convenios
- Carga masiva por Excel con historial de versiones

**Mensajes** *(solo admin)*
- Qué recordatorios se envían y a cuántas horas
- Activar o desactivar la encuesta
- Variables de las plantillas
- Destinos de avisos internos

**Textos visibles al paciente** *(solo admin)*
- Títulos, instrucciones y mensajes de confirmación de la web y el bot

**Legal** *(solo admin)*
- Política de privacidad, texto de consentimiento, plazo de retención

**Marca**
- Logo, colores, nombre visible, datos de contacto

### 11.2 Interruptores

| Interruptor | Default | Efecto |
|---|---|---|
| `otp_web_activo` | ✅ ON | Exige verificación en la web |
| `validar_consultorios` | ❌ **OFF** | Ver §16 |
| `bot_confirma_procedimientos` | ❌ OFF | Si ON, el bot confirma procedimientos sin aprobación |
| `lista_espera_activa` | ✅ ON | |
| `encuesta_activa` | ✅ ON | |
| `canal_web_activo` | ✅ ON | Cierra el agendamiento web sin tocar el resto |
| `canal_bot_activo` | ✅ ON | |
| `modo_mantenimiento` | ❌ OFF | Cierra la agenda pública, el panel sigue operando |

### 11.3 Historial de configuración

Todo cambio de configuración queda en `auditoria` con quién, qué y cuándo, **con opción de revertir desde el panel**. Es lo que resuelve la discusión cuando algo cambió y nadie admite haberlo hecho.

---

## 12. LOPDP y cumplimiento

### 12.1 Base vacía

**El sistema arranca sin ningún paciente cargado.**

Existen archivos históricos (`Revital Whatsapp listado.xlsx`, `Datos facturas`) que **no tienen consentimiento LOPDP**. No se migran.

**Lo que sí se puede hacer con esos datos, fuera de este sistema:**
- Usarlos como audiencia personalizada en Meta (uso distinto al contacto directo)
- Dejarlos archivados para consulta manual si un paciente antiguo vuelve

**Lo que no:** cargarlos y enviarles promociones.

**La jugada correcta:** el sistema recolecta consentimiento desde el día 1 en los tres canales. En seis meses habrá una base de contactables construida legalmente, sin ninguna traba. Además, los pacientes que escriben al WhatsApp por su cuenta abren la puerta ellos mismos: el bot puede pedirles el consentimiento de marketing dentro de esa conversación, y quien acepta entra a la base limpia.

### 12.2 Consentimiento doble

```
☑️  OBLIGATORIO   Acepto el tratamiento de mis datos personales
                  para la gestión de mi cita médica.

☐   OPCIONAL      Quiero recibir promociones e información
                  de salud de Revital.
```

La segunda **desmarcada por defecto**. Se registra fecha, hora, IP, user agent, canal y versión exacta del texto aceptado. Eso es lo que protege ante un reclamo.

### 12.3 Derechos del titular

Botón en el panel (solo admin) para:
- **Exportar** todos los datos de un paciente en formato legible
- **Eliminar** un paciente (borrado lógico + purga programada)

### 12.4 Retención

5 años sin actividad. Proceso automático que marca candidatos y notifica al admin antes de purgar.

### 12.5 `[PENDIENTE]` Textos legales

La política de privacidad y el texto de consentimiento **no existen todavía**. Deben ser redactados y revisados legalmente antes de salir a producción. El sistema los carga desde configuración; no van fijos en código.

---

## 13. Seguridad

- **RLS activo en todas las tablas.** Sin excepción.
- Service role key **solo del lado del servidor**, nunca expuesta al cliente.
- MFA obligatorio para admin.
- API keys por consumidor, rotables desde el panel.
- Rate limiting en endpoints públicos y por API key.
- Auditoría inmutable: política que solo permite INSERT.
- Validación de cédula ecuatoriana con **algoritmo de dígito verificador**.
- Toda validación de disponibilidad y de precio se ejecuta en el servidor.

---

## 14. Orden de construcción

Las tres superficies se **despliegan juntas**. El orden interno es:

**Fase 1 — Núcleo**
1. Esquema completo de base de datos + RLS + auditoría
2. Semilla: sede, consultorios, especialidades, médicos, tarifario (593 servicios)
3. Motor de disponibilidad con pruebas unitarias
4. Auth y roles

**Fase 2 — Panel**
5. Agenda del día y semanal
6. Crear, cancelar, reprogramar cita
7. Pacientes y contactos
8. Sala de espera y marcado de llegada
9. Solicitudes por gestionar
10. Cancelación masiva
11. Catálogo y configuración
12. Reportes y exportación
13. Botón "copiar para ERP"

**Fase 3 — API**
14. Endpoints `/api/v1` con API key, idempotencia y rate limiting
15. Documentación del contrato para configurar Jelou

**Fase 4 — Web**
16. Flujo de 3 pantallas
17. OTP
18. Consentimientos
19. `/mis-citas` con link mágico

**Fase 5 — Automatizaciones**
20. Recordatorios programados
21. Lista de espera
22. No-show automático
23. Vencimiento de solicitudes
24. Encuesta post-cita

**Fase 6 — Analítica**
25. Eventos server-side a Meta, Google y TikTok (sin especialidad)
26. GA4 y GTM
27. Captura de UTM y click IDs

---

## 15. Criterios de aceptación

- [ ] Dos personas no pueden tomar el mismo cupo simultáneamente
- [ ] No se puede agendar en feriado, vacaciones o ausencia
- [ ] No se puede agendar fuera del horario del médico ni del horario del centro
- [ ] No se puede agendar con menos de 3 horas de anticipación
- [ ] Un bloque de 3 cupos nunca acepta un 4º paciente
- [ ] Un paciente no puede tener más de 3 citas activas
- [ ] Un paciente no puede tener 2 citas de la misma especialidad el mismo día
- [ ] La cédula se valida con dígito verificador
- [ ] Un menor de 18 no se agenda sin datos de representante
- [ ] Sin consentimiento de tratamiento de datos, no se agenda
- [ ] El consentimiento de marketing llega desmarcado
- [ ] Una especialidad sin médico activo no aparece en la web ni en el bot
- [ ] Al asignarle un médico, aparece sin intervención de un programador
- [ ] Los eventos de conversión no contienen la especialidad
- [ ] El panel no permite a una admisionista modificar precios
- [ ] Todo cambio queda en auditoría y la auditoría no se puede editar
- [ ] Cancelar el día de un médico notifica a todos sus pacientes
- [ ] El cupo liberado se ofrece solo al primero de la lista, con 30 minutos
- [ ] La app funciona correctamente en celular
- [ ] Toda la base se exporta a Excel desde el panel

---

## 16. Nota sobre consultorios

Hay 7 consultorios y 17 especialistas. **El consultorio es el recurso escaso, no el médico.**

**El mapa de qué médico usa qué consultorio no está disponible todavía.** La estrategia:

1. La tabla `consultorios` y el campo `consultorio_id` se modelan desde el día 1.
2. **La validación arranca APAGADA** (`validar_consultorios = false`).
3. El panel muestra a la admisionista qué consultorios están ocupados en cada hora, y ella decide.
4. Cuando llegue el mapa, se cargan los horarios con consultorio y **se enciende el interruptor**. Sin rehacer nada.

**Por qué esto es seguro:** si la app solo permite agendar dentro del horario publicado de cada médico, no puede crear un choque que no exista ya en la operación real. El riesgo aparece solo en las **solicitudes fuera de horario** y en los **walk-in con médico llamado**, y en ambos casos hay una admisionista mirando.

**Formato para cargar el mapa cuando esté:**

```
Consultorio 1 | Dr. John Méndez      | Lun-Vie 08:00-12:30
Consultorio 1 | Dra. Kenny Zambrano  | Lun-Vie 12:30-17:00
Consultorio 2 | Od. Solange Montilla | Lun-Vie 08:00-12:30
```

Un consultorio puede tener varios médicos en horarios distintos. Lo que no puede es tener dos al mismo tiempo.

---

## 17. Pendientes que no bloquean

Todos se cargan desde el panel una vez desplegado el sistema.

| # | Pendiente | Impacto si no llega |
|---|---|---|
| 1 | Mapa de los 7 consultorios | Validación de consultorio queda apagada |
| 2 | Médicos que atienden sábado 07:30–13:00 | Sábado sin agenda hasta cargarlo |
| 3 | Hora de fin de Gastroenterología | Se asume hasta 17:00 |
| 4 | Quién realiza Rayos X, Ecografía y cardiológicos | Esos servicios sin agenda |
| 5 | **Médico de Cardiología** | El mejor ad set no puede agendar |
| 6 | Lista de exámenes con preparación previa | Campo vacío, se llena por servicio |
| 7 | Capacidad real del laboratorio por franja | Arranca en 4 cada 30 min, editable |
| 8 | Aseguradoras y sus descuentos | CRUD vacío hasta cargarlas |
| 9 | Convenios y beneficiarios | Plantilla Excel ya entregada |
| 10 | Manual de marca | Se usa paleta provisional; al llegar es un archivo de tokens |
| 11 | **Textos legales LOPDP** | **Obligatorio antes de producción** |
| 12 | Tarifas de mensajería de Jelou | Riesgo de sorpresa en el costo mensual |
| 13 | Volumen esperado de citas por día | Se dimensiona sobre el plan Pro |

---

## 18. Decisiones cerradas y su razón

Para que nadie las reabra sin conocer el contexto.

| Decisión | Razón |
|---|---|
| **Sin campo "motivo de consulta"** | Convertiría la base en repositorio de datos de salud de categoría especial bajo LOPDP |
| **Sin FastAPI ni GraphQL** | Duplicaría despliegues y lenguajes sin beneficio para 3 consumidores que piden los mismos datos |
| **Vercel sobre Netlify** | Misma empresa que Next.js |
| **Supabase Pro, no gratuito** | El plan gratuito no tiene respaldos automáticos y pausa el proyecto tras 7 días sin actividad. Esta base es el único registro de las citas del centro. |
| **Base vacía, sin migrar histórico** | Los datos históricos no tienen consentimiento LOPDP |
| **Eventos publicitarios sin especialidad** | Prohibido por las políticas de datos sensibles de Meta, Google y TikTok, y es dato de categoría especial bajo LOPDP |
| **2 recordatorios, no 3** | Costo de plantillas de WhatsApp |
| **Botones tocables, no "responde 1"** | Natural para el paciente y devuelve respuesta estructurada |
| **Sobrecupo prohibido** | Decisión operativa del centro |
| **Tabla de sedes desde el día 1** | Cuesta poco ahora y mucho después |
| **Rol médico modelado pero apagado** | Se activa en v2 sin migración |
| **Un usuario por admisionista** | Credenciales compartidas invalidan la auditoría |
| **Sin restricción de IP en el panel** | Bloquearía el acceso legítimo desde casa un sábado |
