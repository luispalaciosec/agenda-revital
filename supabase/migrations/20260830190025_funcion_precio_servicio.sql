-- precios/listas_precio son de solo admin (§8.1), pero cualquier staff
-- necesita el precio vigente de un servicio para agendar una cita. En
-- vez de abrir la tabla completa a admisionista, una función puntual que
-- solo devuelve "cuánto cuesta este servicio ahora" -- nunca la lista de
-- precios ni los descuentos de aseguradora/convenio.
--
-- "El más bajo manda" (§3.2) entre PVP y promocional vigente; aseguradora
-- y convenio quedan fuera porque requieren que el paciente los declare
-- explícitamente, eso lo resuelve el flujo de creación de cita, no esta
-- función.
create or replace function public.precio_vigente_servicio(p_servicio_id uuid)
returns table(precio numeric, lista_precio_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.valor, p.lista_precio_id
  from public.precios p
  join public.listas_precio lp on lp.id = p.lista_precio_id
  where p.servicio_id = p_servicio_id
    and lp.activa
    and lp.tipo in ('pvp', 'promocional')
    and (
      lp.tipo <> 'promocional'
      or (
        (lp.vigente_desde is null or lp.vigente_desde <= current_date)
        and (lp.vigente_hasta is null or lp.vigente_hasta >= current_date)
      )
    )
  order by p.valor asc
  limit 1;
$$;

revoke execute on function public.precio_vigente_servicio(uuid) from public;
grant execute on function public.precio_vigente_servicio(uuid) to authenticated;
