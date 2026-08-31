# API v1 — contrato para el bot de Jelou

Consumida por el bot de WhatsApp. Ver `docs/ESPECIFICACION.md` §6 para las reglas de negocio completas; este documento es la referencia rápida para configurar Jelou.

## Autenticación

Header `X-API-Key` en cada request. La llave se crea y se revoca desde el panel (`Configuración → Llaves de API`, solo admin) y solo se muestra completa una vez, al crearla.

Sin la llave, o con una revocada: `401`.

## Límite de tasa

60 requests por minuto por llave. Al superarlo: `429 { "error": "..." }`.

## Idempotencia

`POST /citas` acepta el header `Idempotency-Key`. Reintentar con la misma llave (por ejemplo, tras un timeout de red) devuelve la misma respuesta ya creada, nunca una cita duplicada.

## Endpoints

### `GET /api/v1/especialidades`
Especialidades visibles para el bot (`visible_bot = true`, `activa = true`).
```json
[{ "id": "uuid", "nombre": "Ginecología", "slug": "ginecologia", "duracion_min": 20, "modo": "exacto", "requiere_aprobacion": false }]
```

### `GET /api/v1/medicos?especialidad={slug}`
```json
[{ "id": "uuid", "nombres": "Martha", "apellidos": "Escobar", "titulo": "Dra.", "especialidades": [{ "nombre": "Ginecología", "slug": "ginecologia" }] }]
```

### `GET /api/v1/disponibilidad?especialidad={slug}&medico={id?}&desde={fecha}&hasta={fecha}`
```json
[{ "fecha": "2026-09-01", "franjas": [{ "inicio": "2026-09-01T19:30:00.000Z", "fin": "2026-09-01T19:50:00.000Z", "cupos_disponibles": 1, "medico_id": "uuid", "consultorio_id": null }] }]
```

### `POST /api/v1/pacientes/buscar`
```json
{ "documento": "0100000000" }
```
o
```json
{ "celular": "0991112222" }
```
```json
{ "encontrado": true, "paciente": { "id": "uuid", "nombres": "...", "..." }, "pacientes_vinculados": [] }
```

### `POST /api/v1/pacientes`
```json
{
  "tipo_documento": "cedula",
  "documento": "0100000000",
  "nombres": "...",
  "apellidos": "...",
  "fecha_nacimiento": "1990-01-01",
  "correo": "opcional@correo.com",
  "celular": "0991112222",
  "representante": { "documento": "...", "nombres": "...", "parentesco": "Madre" },
  "consentimientos": { "tratamiento_datos": true, "marketing": false }
}
```
`consentimientos.tratamiento_datos` es obligatorio (`true`) — sin él, `400`.
```json
{ "paciente_id": "uuid", "contacto_id": "uuid" }
```

### `POST /api/v1/citas`
```json
{
  "celular": "0991112222",
  "especialidad_id": "uuid",
  "servicio_id": "uuid",
  "medico_id": "uuid o null",
  "consultorio_id": "uuid o null",
  "inicio": "2026-09-01T19:30:00.000Z",
  "fin": "2026-09-01T19:50:00.000Z",
  "paciente_id": "uuid (si ya existe)",
  "paciente_nuevo": { "tipoDocumento": "cedula", "documento": "...", "nombres": "...", "apellidos": "...", "fechaNacimiento": "1990-01-01" },
  "consentimiento_marketing": false,
  "atribucion": { "utm_source": "...", "fbclid": "...", "gclid": "...", "ttclid": "..." }
}
```
Manda `paciente_id` **o** `paciente_nuevo`, no ambos.

Respuesta (`201`):
```json
{ "cita_id": "uuid", "codigo_publico": "RVT-XXXXX", "estado": "confirmada", "mensaje_para_paciente": "Tu cita quedó confirmada..." }
```

`estado` es `confirmada` para consultas, o `solicitada` para procedimientos (`servicio.requiere_aprobacion = true`) salvo que el interruptor `bot_confirma_procedimientos` esté encendido en configuración. **`mensaje_para_paciente` ya viene redactado — el bot solo lo repite, no interpreta el estado.**

### `GET /api/v1/citas/{id}`
Detalle completo de una cita.

### `POST /api/v1/citas/{id}/cancelar`
```json
{ "motivo": "opcional" }
```

### `POST /api/v1/citas/{id}/reprogramar`
```json
{ "nuevo_inicio": "2026-09-02T15:00:00.000Z" }
```
Mantiene médico y consultorio originales; falla si ya se alcanzó el máximo de reprogramaciones (`reprogramacion_max_veces` en configuración).

### `GET /api/v1/citas?contacto={celular}&estado=activas`
Citas del contacto y sus pacientes vinculados. `estado=activas` filtra a `solicitada|en_gestion|confirmada`; sin ese parámetro, trae todas.

### `POST /api/v1/lista-espera`
```json
{ "paciente_id": "uuid", "especialidad_id": "uuid", "medico_id": "uuid o null", "fecha_deseada": "2026-09-05" }
```
El paciente debe existir y tener un contacto vinculado (crearlo antes con `POST /pacientes`).

## Errores

Todos los errores devuelven `{ "error": "mensaje" }`. `404` cuando el mensaje indica "no encontrada/o"; `400` para el resto (incluida validación de datos); `401`/`429` para autenticación y límite de tasa.

## Pendiente para el lanzamiento

El bot debe correr sobre un número de WhatsApp Business nuevo — los anuncios click-to-WhatsApp de Meta deben repuntarse a ese número o el bot nunca verá los leads (§6.3). Esto es una tarea de configuración en Meta/Jelou, no de desarrollo.
