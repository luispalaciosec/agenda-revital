create table public.especialidades (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id),
  nombre text not null,
  slug text not null,
  descripcion_publica text,
  modo public.modo_agenda_enum not null,
  duracion_min smallint not null check (duracion_min > 0),
  cupos_por_bloque smallint not null default 1 check (cupos_por_bloque >= 1),
  requiere_aprobacion boolean not null default false,
  -- visible_web/visible_bot NO se editan a mano: las recalcula
  -- trg_recalcular_visibilidad cuando cambia medico_especialidad o
  -- medicos.activo (§3.2, §5.1, §11.1 "aparece sin intervención de un
  -- programador"). El admin actúa asignando/activando un médico, no
  -- tocando estas dos columnas.
  visible_web boolean not null default false,
  visible_bot boolean not null default false,
  orden_visualizacion smallint not null default 0,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (sede_id, slug)
);

create trigger trg_especialidades_actualizado_en
  before update on public.especialidades
  for each row execute function public.tocar_actualizado_en();

create trigger trg_especialidades_auditoria
  after insert or update or delete on public.especialidades
  for each row execute function public.fn_registrar_auditoria();

alter table public.especialidades enable row level security;

create policy especialidades_select_staff on public.especialidades
  for select to authenticated using (public.es_staff_activo());

create policy especialidades_all_staff on public.especialidades
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.medicos (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id),
  nombres text not null,
  apellidos text not null,
  titulo text,
  -- Nullable a propósito: la cédula real de cada médico es un dato
  -- pendiente de carga por el centro (no se fabrica). Cuando llegue, se
  -- valida con el mismo dígito verificador que pacientes.documento.
  cedula text unique check (cedula is null or public.validar_cedula_ecuador(cedula)),
  celular text,
  correo text,
  consultorio_default_id uuid references public.consultorios(id),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger trg_medicos_actualizado_en
  before update on public.medicos
  for each row execute function public.tocar_actualizado_en();

create trigger trg_medicos_auditoria
  after insert or update or delete on public.medicos
  for each row execute function public.fn_registrar_auditoria();

alter table public.medicos enable row level security;

create policy medicos_select_staff on public.medicos
  for select to authenticated using (public.es_staff_activo());

create policy medicos_all_staff on public.medicos
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());


create table public.medico_especialidad (
  medico_id uuid not null references public.medicos(id) on delete cascade,
  especialidad_id uuid not null references public.especialidades(id) on delete cascade,
  primary key (medico_id, especialidad_id)
);

alter table public.medico_especialidad enable row level security;

create policy medico_especialidad_select_staff on public.medico_especialidad
  for select to authenticated using (public.es_staff_activo());

create policy medico_especialidad_all_staff on public.medico_especialidad
  for all to authenticated
  using (public.es_staff_activo())
  with check (public.es_staff_activo());

-- Recalcula visible_web/visible_bot de una especialidad: visible solo si
-- está activa y tiene al menos un médico activo asignado.
create or replace function public.recalcular_visibilidad_especialidad(p_especialidad_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tiene_medico_activo boolean;
begin
  select exists (
    select 1
    from public.medico_especialidad me
    join public.medicos m on m.id = me.medico_id
    where me.especialidad_id = p_especialidad_id and m.activo = true
  ) into v_tiene_medico_activo;

  update public.especialidades
  set visible_web = activa and v_tiene_medico_activo,
      visible_bot = activa and v_tiene_medico_activo
  where id = p_especialidad_id;
end;
$$;

create or replace function public.trg_fn_recalcular_visibilidad_por_asignacion()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_visibilidad_especialidad(old.especialidad_id);
    return old;
  else
    perform public.recalcular_visibilidad_especialidad(new.especialidad_id);
    return new;
  end if;
end;
$$;

create trigger trg_medico_especialidad_visibilidad
  after insert or delete on public.medico_especialidad
  for each row execute function public.trg_fn_recalcular_visibilidad_por_asignacion();

create or replace function public.trg_fn_recalcular_visibilidad_por_medico()
returns trigger
language plpgsql
as $$
declare
  v_especialidad_id uuid;
begin
  if new.activo is distinct from old.activo then
    for v_especialidad_id in
      select especialidad_id from public.medico_especialidad where medico_id = new.id
    loop
      perform public.recalcular_visibilidad_especialidad(v_especialidad_id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger trg_medicos_visibilidad
  after update on public.medicos
  for each row execute function public.trg_fn_recalcular_visibilidad_por_medico();

-- También al (des)activar la especialidad misma.
create or replace function public.trg_fn_recalcular_visibilidad_por_especialidad()
returns trigger
language plpgsql
as $$
begin
  if new.activa is distinct from old.activa then
    perform public.recalcular_visibilidad_especialidad(new.id);
  end if;
  return new;
end;
$$;

create trigger trg_especialidades_visibilidad
  after update on public.especialidades
  for each row
  when (new.activa is distinct from old.activa)
  execute function public.trg_fn_recalcular_visibilidad_por_especialidad();
