insert into public.configuracion (clave, valor, categoria, descripcion) values
  ('meta_capi_pixel_id', '"1599389511054391"', 'integraciones', 'Dataset/Pixel ID de Meta para enviar el evento LeadSubmitted vía Conversions API.'),
  ('meta_capi_token', 'null', 'integraciones', 'Token de acceso de la API de conversiones de Meta (Events Manager → Integraciones → API de conversiones).'),
  ('meta_capi_test_event_code', 'null', 'integraciones', 'Código de prueba de Meta (pestaña "Probar eventos"). Null en producción.'),
  ('meta_capi_page_id', 'null', 'integraciones', 'ID de la página de Facebook asociada a la cuenta de WhatsApp Business. Requerido por Meta para eventos con action_source=business_messaging.');
