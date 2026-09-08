alter table public.citas add column ctwa_clid text;

comment on column public.citas.ctwa_clid is 'Click ID de un anuncio "Click to WhatsApp" de Meta (objeto referral del primer mensaje entrante). Requerido por Meta Conversions API para eventos con action_source=business_messaging.';
