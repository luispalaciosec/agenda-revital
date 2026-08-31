-- Algoritmo oficial del dígito verificador de cédula ecuatoriana (SRI).
-- Usada por medicos.cedula y pacientes.documento (§13).
create or replace function public.validar_cedula_ecuador(p_cedula text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_digitos int[];
  v_provincia int;
  v_tercer_digito int;
  v_suma int := 0;
  v_valor int;
  v_i int;
begin
  if p_cedula is null or p_cedula !~ '^[0-9]{10}$' then
    return false;
  end if;

  for v_i in 1..10 loop
    v_digitos[v_i] := substr(p_cedula, v_i, 1)::int;
  end loop;

  v_provincia := v_digitos[1] * 10 + v_digitos[2];
  if v_provincia < 1 or v_provincia > 24 then
    return false;
  end if;

  v_tercer_digito := v_digitos[3];
  if v_tercer_digito > 6 then
    return false;
  end if;

  for v_i in 1..9 loop
    if v_i % 2 = 1 then
      v_valor := v_digitos[v_i] * 2;
      if v_valor > 9 then
        v_valor := v_valor - 9;
      end if;
    else
      v_valor := v_digitos[v_i];
    end if;
    v_suma := v_suma + v_valor;
  end loop;

  return ((10 - (v_suma % 10)) % 10) = v_digitos[10];
end;
$$;
