-- Fase 3 (API /api/v1) y Fase 4 (web pública): llaves de API, idempotencia,
-- límite de tasa, códigos OTP y enlaces mágicos de /mis-citas. Ninguna de
-- estas tablas la toca el cliente directo: solo el service role (bot, web,
-- jobs) y, para api_keys, el panel con rol admin.

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  prefijo text not null,
  llave_hash text not null unique,
  activa boolean not null default true,
  creado_por uuid references public.usuarios(id),
  creado_en timestamptz not null default now(),
  revocada_en timestamptz,
  ultimo_uso_en timestamptz
);
comment on table public.api_keys is 'Llaves del API v1 (§13). Cada consumidor (p. ej. el bot de Jelou) tiene la suya, revocable sin afectar a las demás. Solo se guarda el hash; la llave en claro se muestra una sola vez al crearla, desde el panel.';

alter table public.api_keys enable row level security;
create policy api_keys_admin_selecciona on public.api_keys for select to authenticated using (public.es_admin());
create policy api_keys_admin_inserta on public.api_keys for insert to authenticated with check (public.es_admin());
create policy api_keys_admin_actualiza on public.api_keys for update to authenticated using (public.es_admin()) with check (public.es_admin());

create table public.idempotencia_citas (
  llave text primary key,
  cita_id uuid not null references public.citas(id),
  respuesta jsonb not null,
  creado_en timestamptz not null default now()
);
comment on table public.idempotencia_citas is 'POST /api/v1/citas con el mismo header Idempotency-Key devuelve la misma respuesta en vez de crear una cita duplicada (§6.2).';
alter table public.idempotencia_citas enable row level security;

create table public.limite_tasa (
  identificador text not null,
  ventana_inicio timestamptz not null,
  contador integer not null default 1,
  primary key (identificador, ventana_inicio)
);
comment on table public.limite_tasa is 'Contador de ventana fija para rate limiting del API público y del OTP web (§6.2, §7.2). identificador combina el recurso limitado con la llave de API o la IP.';
alter table public.limite_tasa enable row level security;

create table public.otp_codigos (
  id uuid primary key default gen_random_uuid(),
  celular text not null,
  codigo_hash text not null,
  intentos smallint not null default 0,
  verificado_en timestamptz,
  expira_en timestamptz not null,
  creado_en timestamptz not null default now()
);
comment on table public.otp_codigos is 'OTP de 6 dígitos de la web pública (§7.2). Válido 10 minutos, máximo 3 intentos. El bot no lo usa: el paciente ya escribió desde su número.';
alter table public.otp_codigos enable row level security;
create index idx_otp_codigos_celular on public.otp_codigos (celular, creado_en desc);

create table public.enlaces_magicos (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  contacto_id uuid not null references public.contactos(id),
  expira_en timestamptz not null,
  usado_en timestamptz,
  creado_en timestamptz not null default now()
);
comment on table public.enlaces_magicos is 'Link mágico de /mis-citas (§7.5), enviado por WhatsApp. Expira a las 24 horas. Sin contraseña, sin registro.';
alter table public.enlaces_magicos enable row level security;

-- Límite de tasa atómico: incrementa el contador de la ventana actual y
-- dice si el request cabe. plpgsql para que el upsert+lectura sea una sola
-- operación server-side, sin condición de carrera entre dos requests
-- concurrentes del mismo identificador.
create or replace function public.verificar_limite_tasa(
  p_identificador text,
  p_limite integer,
  p_ventana_segundos integer
)
returns boolean
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_ventana_inicio timestamptz;
  v_contador integer;
begin
  v_ventana_inicio := to_timestamp(floor(extract(epoch from now()) / p_ventana_segundos) * p_ventana_segundos);

  insert into public.limite_tasa (identificador, ventana_inicio, contador)
  values (p_identificador, v_ventana_inicio, 1)
  on conflict (identificador, ventana_inicio)
  do update set contador = public.limite_tasa.contador + 1
  returning contador into v_contador;

  return v_contador <= p_limite;
end;
$$;

revoke execute on function public.verificar_limite_tasa(text, integer, integer) from public, anon, authenticated;
grant execute on function public.verificar_limite_tasa(text, integer, integer) to service_role;
