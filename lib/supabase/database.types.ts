export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aseguradoras: {
        Row: {
          activa: boolean
          actualizado_en: string
          creado_en: string
          descuento_pct: number
          id: string
          nombre: string
          requiere_autorizacion_previa: boolean
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descuento_pct: number
          id?: string
          nombre: string
          requiere_autorizacion_previa?: boolean
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descuento_pct?: number
          id?: string
          nombre?: string
          requiere_autorizacion_previa?: boolean
        }
        Relationships: []
      }
      auditoria: {
        Row: {
          accion: Database["public"]["Enums"]["accion_auditoria_enum"]
          creado_en: string
          datos_antes: Json | null
          datos_despues: Json | null
          entidad: string
          entidad_id: string | null
          id: string
          ip: unknown
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["accion_auditoria_enum"]
          creado_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          entidad: string
          entidad_id?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["accion_auditoria_enum"]
          creado_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          entidad?: string
          entidad_id?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cargas_precio: {
        Row: {
          archivo_nombre: string
          cargado_en: string
          cargado_por: string | null
          filas_afectadas: number
          id: string
          lista_precio_id: string
          snapshot: Json
        }
        Insert: {
          archivo_nombre: string
          cargado_en?: string
          cargado_por?: string | null
          filas_afectadas?: number
          id?: string
          lista_precio_id: string
          snapshot: Json
        }
        Update: {
          archivo_nombre?: string
          cargado_en?: string
          cargado_por?: string | null
          filas_afectadas?: number
          id?: string
          lista_precio_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cargas_precio_lista_precio_id_fkey"
            columns: ["lista_precio_id"]
            isOneToOne: false
            referencedRelation: "listas_precio"
            referencedColumns: ["id"]
          },
        ]
      }
      citas: {
        Row: {
          actualizado_en: string
          aseguradora_id: string | null
          atendida_en: string | null
          canal: Database["public"]["Enums"]["canal_cita_enum"]
          codigo_publico: string | null
          consultorio_id: string | null
          contacto_id: string
          convenio_id: string | null
          creado_en: string
          creado_por: string | null
          especialidad_id: string
          estado: Database["public"]["Enums"]["estado_cita_enum"]
          fbclid: string | null
          fecha_local: string | null
          fin: string
          gclid: string | null
          id: string
          indice_cupo: number | null
          inicio: string
          lista_precio_id: string
          llegada_en: string | null
          medico_id: string | null
          nota_admision: string | null
          paciente_id: string
          precio_aplicado: number
          referrer: string | null
          reprogramaciones_count: number
          sede_id: string
          servicio_id: string
          ttclid: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          actualizado_en?: string
          aseguradora_id?: string | null
          atendida_en?: string | null
          canal: Database["public"]["Enums"]["canal_cita_enum"]
          codigo_publico?: string | null
          consultorio_id?: string | null
          contacto_id: string
          convenio_id?: string | null
          creado_en?: string
          creado_por?: string | null
          especialidad_id: string
          estado?: Database["public"]["Enums"]["estado_cita_enum"]
          fbclid?: string | null
          fecha_local?: string | null
          fin: string
          gclid?: string | null
          id?: string
          indice_cupo?: number | null
          inicio: string
          lista_precio_id: string
          llegada_en?: string | null
          medico_id?: string | null
          nota_admision?: string | null
          paciente_id: string
          precio_aplicado: number
          referrer?: string | null
          reprogramaciones_count?: number
          sede_id: string
          servicio_id: string
          ttclid?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          actualizado_en?: string
          aseguradora_id?: string | null
          atendida_en?: string | null
          canal?: Database["public"]["Enums"]["canal_cita_enum"]
          codigo_publico?: string | null
          consultorio_id?: string | null
          contacto_id?: string
          convenio_id?: string | null
          creado_en?: string
          creado_por?: string | null
          especialidad_id?: string
          estado?: Database["public"]["Enums"]["estado_cita_enum"]
          fbclid?: string | null
          fecha_local?: string | null
          fin?: string
          gclid?: string | null
          id?: string
          indice_cupo?: number | null
          inicio?: string
          lista_precio_id?: string
          llegada_en?: string | null
          medico_id?: string | null
          nota_admision?: string | null
          paciente_id?: string
          precio_aplicado?: number
          referrer?: string | null
          reprogramaciones_count?: number
          sede_id?: string
          servicio_id?: string
          ttclid?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_consultorio_id_fkey"
            columns: ["consultorio_id"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_lista_precio_id_fkey"
            columns: ["lista_precio_id"]
            isOneToOne: false
            referencedRelation: "listas_precio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          categoria: string
          clave: string
          descripcion: string | null
          valor: Json
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          categoria: string
          clave: string
          descripcion?: string | null
          valor: Json
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          categoria?: string
          clave?: string
          descripcion?: string | null
          valor?: Json
        }
        Relationships: []
      }
      consentimientos: {
        Row: {
          canal: Database["public"]["Enums"]["canal_cita_enum"]
          id: string
          ip: unknown
          otorgado: boolean
          otorgado_en: string
          otorgado_por: Database["public"]["Enums"]["otorgado_por_enum"]
          paciente_id: string
          representante_documento: string | null
          revocado_en: string | null
          tipo: Database["public"]["Enums"]["tipo_consentimiento_enum"]
          user_agent: string | null
          version_texto: string
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal_cita_enum"]
          id?: string
          ip?: unknown
          otorgado: boolean
          otorgado_en?: string
          otorgado_por: Database["public"]["Enums"]["otorgado_por_enum"]
          paciente_id: string
          representante_documento?: string | null
          revocado_en?: string | null
          tipo: Database["public"]["Enums"]["tipo_consentimiento_enum"]
          user_agent?: string | null
          version_texto: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_cita_enum"]
          id?: string
          ip?: unknown
          otorgado?: boolean
          otorgado_en?: string
          otorgado_por?: Database["public"]["Enums"]["otorgado_por_enum"]
          paciente_id?: string
          representante_documento?: string | null
          revocado_en?: string | null
          tipo?: Database["public"]["Enums"]["tipo_consentimiento_enum"]
          user_agent?: string | null
          version_texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "consentimientos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      consultorios: {
        Row: {
          activo: boolean
          actualizado_en: string
          creado_en: string
          id: string
          nombre: string
          numero: number
          sede_id: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          id?: string
          nombre: string
          numero: number
          sede_id: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          id?: string
          nombre?: string
          numero?: number
          sede_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultorios_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      contacto_paciente: {
        Row: {
          contacto_id: string
          creado_en: string
          paciente_id: string
          relacion: string | null
        }
        Insert: {
          contacto_id: string
          creado_en?: string
          paciente_id: string
          relacion?: string | null
        }
        Update: {
          contacto_id?: string
          creado_en?: string
          paciente_id?: string
          relacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacto_paciente_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacto_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos: {
        Row: {
          celular: string
          creado_en: string
          id: string
          ultimo_acceso: string | null
          verificado: boolean
          verificado_en: string | null
        }
        Insert: {
          celular: string
          creado_en?: string
          id?: string
          ultimo_acceso?: string | null
          verificado?: boolean
          verificado_en?: string | null
        }
        Update: {
          celular?: string
          creado_en?: string
          id?: string
          ultimo_acceso?: string | null
          verificado?: boolean
          verificado_en?: string | null
        }
        Relationships: []
      }
      convenio_beneficiarios: {
        Row: {
          apellidos: string
          cedula: string
          convenio_id: string
          creado_en: string
          id: string
          nombres: string
          parentesco: Database["public"]["Enums"]["parentesco_convenio_enum"]
          vigencia_desde: string
          vigencia_hasta: string | null
        }
        Insert: {
          apellidos: string
          cedula: string
          convenio_id: string
          creado_en?: string
          id?: string
          nombres: string
          parentesco: Database["public"]["Enums"]["parentesco_convenio_enum"]
          vigencia_desde: string
          vigencia_hasta?: string | null
        }
        Update: {
          apellidos?: string
          cedula?: string
          convenio_id?: string
          creado_en?: string
          id?: string
          nombres?: string
          parentesco?: Database["public"]["Enums"]["parentesco_convenio_enum"]
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convenio_beneficiarios_convenio_id_fkey"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenios"
            referencedColumns: ["id"]
          },
        ]
      }
      convenios: {
        Row: {
          activo: boolean
          actualizado_en: string
          contacto: string | null
          creado_en: string
          descuento_pct: number
          id: string
          nombre: string
          ruc_empresa: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          contacto?: string | null
          creado_en?: string
          descuento_pct: number
          id?: string
          nombre: string
          ruc_empresa: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          contacto?: string | null
          creado_en?: string
          descuento_pct?: number
          id?: string
          nombre?: string
          ruc_empresa?: string
        }
        Relationships: []
      }
      especialidades: {
        Row: {
          activa: boolean
          actualizado_en: string
          creado_en: string
          cupos_por_bloque: number
          descripcion_publica: string | null
          duracion_min: number
          id: string
          modo: Database["public"]["Enums"]["modo_agenda_enum"]
          nombre: string
          orden_visualizacion: number
          requiere_aprobacion: boolean
          sede_id: string
          slug: string
          visible_bot: boolean
          visible_web: boolean
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          cupos_por_bloque?: number
          descripcion_publica?: string | null
          duracion_min: number
          id?: string
          modo: Database["public"]["Enums"]["modo_agenda_enum"]
          nombre: string
          orden_visualizacion?: number
          requiere_aprobacion?: boolean
          sede_id: string
          slug: string
          visible_bot?: boolean
          visible_web?: boolean
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          cupos_por_bloque?: number
          descripcion_publica?: string | null
          duracion_min?: number
          id?: string
          modo?: Database["public"]["Enums"]["modo_agenda_enum"]
          nombre?: string
          orden_visualizacion?: number
          requiere_aprobacion?: boolean
          sede_id?: string
          slug?: string
          visible_bot?: boolean
          visible_web?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      excepciones_agenda: {
        Row: {
          alcance: Database["public"]["Enums"]["alcance_excepcion_enum"]
          consultorio_id: string | null
          creado_en: string
          creado_por: string | null
          fecha_desde: string
          fecha_hasta: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          medico_id: string | null
          motivo: string | null
          sede_id: string | null
          tipo: Database["public"]["Enums"]["tipo_excepcion_enum"]
        }
        Insert: {
          alcance: Database["public"]["Enums"]["alcance_excepcion_enum"]
          consultorio_id?: string | null
          creado_en?: string
          creado_por?: string | null
          fecha_desde: string
          fecha_hasta: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          medico_id?: string | null
          motivo?: string | null
          sede_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_excepcion_enum"]
        }
        Update: {
          alcance?: Database["public"]["Enums"]["alcance_excepcion_enum"]
          consultorio_id?: string | null
          creado_en?: string
          creado_por?: string | null
          fecha_desde?: string
          fecha_hasta?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          medico_id?: string | null
          motivo?: string | null
          sede_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_excepcion_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "excepciones_agenda_consultorio_id_fkey"
            columns: ["consultorio_id"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "excepciones_agenda_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "excepciones_agenda_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios: {
        Row: {
          activo: boolean
          actualizado_en: string
          consultorio_id: string | null
          creado_en: string
          cupos_por_bloque: number
          dia_semana: number
          duracion_min: number
          especialidad_id: string
          hora_fin: string
          hora_inicio: string
          id: string
          medico_id: string | null
          modo: Database["public"]["Enums"]["modo_agenda_enum"]
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          consultorio_id?: string | null
          creado_en?: string
          cupos_por_bloque?: number
          dia_semana: number
          duracion_min: number
          especialidad_id: string
          hora_fin: string
          hora_inicio: string
          id?: string
          medico_id?: string | null
          modo: Database["public"]["Enums"]["modo_agenda_enum"]
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          consultorio_id?: string | null
          creado_en?: string
          cupos_por_bloque?: number
          dia_semana?: number
          duracion_min?: number
          especialidad_id?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          medico_id?: string | null
          modo?: Database["public"]["Enums"]["modo_agenda_enum"]
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_consultorio_id_fkey"
            columns: ["consultorio_id"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          contacto_id: string
          creado_en: string
          especialidad_id: string
          estado: Database["public"]["Enums"]["estado_lista_espera_enum"]
          expira_en: string | null
          fecha_deseada: string
          id: string
          medico_id: string | null
          notificado_en: string | null
          paciente_id: string
        }
        Insert: {
          contacto_id: string
          creado_en?: string
          especialidad_id: string
          estado?: Database["public"]["Enums"]["estado_lista_espera_enum"]
          expira_en?: string | null
          fecha_deseada: string
          id?: string
          medico_id?: string | null
          notificado_en?: string | null
          paciente_id: string
        }
        Update: {
          contacto_id?: string
          creado_en?: string
          especialidad_id?: string
          estado?: Database["public"]["Enums"]["estado_lista_espera_enum"]
          expira_en?: string | null
          fecha_deseada?: string
          id?: string
          medico_id?: string | null
          notificado_en?: string | null
          paciente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      listas_precio: {
        Row: {
          activa: boolean
          actualizado_en: string
          creado_en: string
          descuento_pct: number | null
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_lista_precio_enum"]
          vigente_desde: string | null
          vigente_hasta: string | null
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descuento_pct?: number | null
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_lista_precio_enum"]
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          descuento_pct?: number | null
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_lista_precio_enum"]
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Relationships: []
      }
      medico_especialidad: {
        Row: {
          especialidad_id: string
          medico_id: string
        }
        Insert: {
          especialidad_id: string
          medico_id: string
        }
        Update: {
          especialidad_id?: string
          medico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medico_especialidad_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medico_especialidad_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id"]
          },
        ]
      }
      medicos: {
        Row: {
          activo: boolean
          actualizado_en: string
          apellidos: string
          cedula: string | null
          celular: string | null
          consultorio_default_id: string | null
          correo: string | null
          creado_en: string
          id: string
          nombres: string
          sede_id: string
          titulo: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          apellidos: string
          cedula?: string | null
          celular?: string | null
          consultorio_default_id?: string | null
          correo?: string | null
          creado_en?: string
          id?: string
          nombres: string
          sede_id: string
          titulo?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          apellidos?: string
          cedula?: string | null
          celular?: string | null
          consultorio_default_id?: string | null
          correo?: string | null
          creado_en?: string
          id?: string
          nombres?: string
          sede_id?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicos_consultorio_default_id_fkey"
            columns: ["consultorio_default_id"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicos_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          canal: Database["public"]["Enums"]["canal_notificacion_enum"]
          cita_id: string | null
          creado_en: string
          enviada_en: string | null
          error: string | null
          estado: Database["public"]["Enums"]["estado_notificacion_enum"]
          id: string
          paciente_id: string
          plantilla: string | null
          programada_para: string
          proveedor_id: string | null
          tipo: Database["public"]["Enums"]["tipo_notificacion_enum"]
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal_notificacion_enum"]
          cita_id?: string | null
          creado_en?: string
          enviada_en?: string | null
          error?: string | null
          estado?: Database["public"]["Enums"]["estado_notificacion_enum"]
          id?: string
          paciente_id: string
          plantilla?: string | null
          programada_para: string
          proveedor_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_notificacion_enum"]
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_notificacion_enum"]
          cita_id?: string | null
          creado_en?: string
          enviada_en?: string | null
          error?: string | null
          estado?: Database["public"]["Enums"]["estado_notificacion_enum"]
          id?: string
          paciente_id?: string
          plantilla?: string | null
          programada_para?: string
          proveedor_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_notificacion_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          actualizado_en: string
          apellidos: string
          contador_no_show: number
          correo: string | null
          creado_en: string
          documento: string
          fecha_nacimiento: string
          historia_clinica: string | null
          id: string
          nombres: string
          representante_documento: string | null
          representante_nombres: string | null
          representante_parentesco: string | null
          tipo_documento: Database["public"]["Enums"]["tipo_documento_enum"]
        }
        Insert: {
          actualizado_en?: string
          apellidos: string
          contador_no_show?: number
          correo?: string | null
          creado_en?: string
          documento: string
          fecha_nacimiento: string
          historia_clinica?: string | null
          id?: string
          nombres: string
          representante_documento?: string | null
          representante_nombres?: string | null
          representante_parentesco?: string | null
          tipo_documento: Database["public"]["Enums"]["tipo_documento_enum"]
        }
        Update: {
          actualizado_en?: string
          apellidos?: string
          contador_no_show?: number
          correo?: string | null
          creado_en?: string
          documento?: string
          fecha_nacimiento?: string
          historia_clinica?: string | null
          id?: string
          nombres?: string
          representante_documento?: string | null
          representante_nombres?: string | null
          representante_parentesco?: string | null
          tipo_documento?: Database["public"]["Enums"]["tipo_documento_enum"]
        }
        Relationships: []
      }
      precios: {
        Row: {
          actualizado_en: string
          creado_en: string
          id: string
          lista_precio_id: string
          servicio_id: string
          valor: number
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          lista_precio_id: string
          servicio_id: string
          valor: number
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          lista_precio_id?: string
          servicio_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "precios_lista_precio_id_fkey"
            columns: ["lista_precio_id"]
            isOneToOne: false
            referencedRelation: "listas_precio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precios_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      sedes: {
        Row: {
          activa: boolean
          actualizado_en: string
          creado_en: string
          direccion: string
          hora_apertura_lv: string
          hora_apertura_sab: string | null
          hora_cierre_lv: string
          hora_cierre_sab: string | null
          id: string
          nombre: string
          telefono: string | null
          zona_horaria: string
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          direccion: string
          hora_apertura_lv: string
          hora_apertura_sab?: string | null
          hora_cierre_lv: string
          hora_cierre_sab?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          zona_horaria?: string
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          creado_en?: string
          direccion?: string
          hora_apertura_lv?: string
          hora_apertura_sab?: string | null
          hora_cierre_lv?: string
          hora_cierre_sab?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          zona_horaria?: string
        }
        Relationships: []
      }
      servicios: {
        Row: {
          activo: boolean
          actualizado_en: string
          agendable: boolean
          codigo_revital: string
          creado_en: string
          descripcion: string
          duracion_min: number | null
          especialidad_id: string | null
          id: string
          preparacion_previa: string | null
          requiere_aprobacion: boolean
          sede_id: string
          tipo: string
          visible_bot: boolean
          visible_web: boolean
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          agendable?: boolean
          codigo_revital: string
          creado_en?: string
          descripcion: string
          duracion_min?: number | null
          especialidad_id?: string | null
          id?: string
          preparacion_previa?: string | null
          requiere_aprobacion?: boolean
          sede_id: string
          tipo: string
          visible_bot?: boolean
          visible_web?: boolean
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          agendable?: boolean
          codigo_revital?: string
          creado_en?: string
          descripcion?: string
          duracion_min?: number | null
          especialidad_id?: string | null
          id?: string
          preparacion_previa?: string | null
          requiere_aprobacion?: boolean
          sede_id?: string
          tipo?: string
          visible_bot?: boolean
          visible_web?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "servicios_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_agrupados: {
        Row: {
          actualizado_en: string
          creado_en: string
          duracion_min: number
          especialidad_id: string
          id: string
          nombre: string
          servicios_ids: string[]
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          duracion_min: number
          especialidad_id: string
          id?: string
          nombre: string
          servicios_ids: string[]
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          duracion_min?: number
          especialidad_id?: string
          id?: string
          nombre?: string
          servicios_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "servicios_agrupados_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_gestion: {
        Row: {
          asignada_a: string | null
          cita_id: string
          creado_en: string
          id: string
          observacion: string | null
          resuelta_en: string | null
          resultado:
            | Database["public"]["Enums"]["resultado_solicitud_enum"]
            | null
          vence_en: string
        }
        Insert: {
          asignada_a?: string | null
          cita_id: string
          creado_en?: string
          id?: string
          observacion?: string | null
          resuelta_en?: string | null
          resultado?:
            | Database["public"]["Enums"]["resultado_solicitud_enum"]
            | null
          vence_en: string
        }
        Update: {
          asignada_a?: string | null
          cita_id?: string
          creado_en?: string
          id?: string
          observacion?: string | null
          resuelta_en?: string | null
          resultado?:
            | Database["public"]["Enums"]["resultado_solicitud_enum"]
            | null
          vence_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_gestion_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean
          actualizado_en: string
          apellidos: string
          auth_user_id: string
          celular: string | null
          correo: string
          creado_en: string
          id: string
          mfa_habilitado: boolean
          nombres: string
          rol: Database["public"]["Enums"]["rol_usuario_enum"]
          ultimo_acceso: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          apellidos: string
          auth_user_id: string
          celular?: string | null
          correo: string
          creado_en?: string
          id?: string
          mfa_habilitado?: boolean
          nombres: string
          rol: Database["public"]["Enums"]["rol_usuario_enum"]
          ultimo_acceso?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          apellidos?: string
          auth_user_id?: string
          celular?: string | null
          correo?: string
          creado_en?: string
          id?: string
          mfa_habilitado?: boolean
          nombres?: string
          rol?: Database["public"]["Enums"]["rol_usuario_enum"]
          ultimo_acceso?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_admin: { Args: never; Returns: boolean }
      es_staff_activo: { Args: never; Returns: boolean }
      generar_codigo_publico: { Args: never; Returns: string }
      obtener_configuracion: {
        Args: { p_clave: string; p_default?: Json }
        Returns: Json
      }
      precio_vigente_servicio: {
        Args: { p_servicio_id: string }
        Returns: {
          lista_precio_id: string
          precio: number
        }[]
      }
      recalcular_visibilidad_especialidad: {
        Args: { p_especialidad_id: string }
        Returns: undefined
      }
      reprogramar_cita: {
        Args: {
          p_cita_id: string
          p_nuevo_consultorio_id: string
          p_nuevo_fin: string
          p_nuevo_inicio: string
          p_nuevo_medico_id: string
        }
        Returns: {
          actualizado_en: string
          aseguradora_id: string | null
          atendida_en: string | null
          canal: Database["public"]["Enums"]["canal_cita_enum"]
          codigo_publico: string | null
          consultorio_id: string | null
          contacto_id: string
          convenio_id: string | null
          creado_en: string
          creado_por: string | null
          especialidad_id: string
          estado: Database["public"]["Enums"]["estado_cita_enum"]
          fbclid: string | null
          fecha_local: string | null
          fin: string
          gclid: string | null
          id: string
          indice_cupo: number | null
          inicio: string
          lista_precio_id: string
          llegada_en: string | null
          medico_id: string | null
          nota_admision: string | null
          paciente_id: string
          precio_aplicado: number
          referrer: string | null
          reprogramaciones_count: number
          sede_id: string
          servicio_id: string
          ttclid: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "citas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rol_actual: { Args: never; Returns: string }
      sumar_horas_laborables: {
        Args: { p_desde: string; p_horas: number; p_sede_id: string }
        Returns: string
      }
      usuario_actual_id: { Args: never; Returns: string }
      validar_cedula_ecuador: { Args: { p_cedula: string }; Returns: boolean }
    }
    Enums: {
      accion_auditoria_enum: "crear" | "actualizar" | "eliminar"
      alcance_excepcion_enum: "sede" | "medico" | "consultorio"
      canal_cita_enum: "web" | "bot" | "panel"
      canal_notificacion_enum: "whatsapp" | "correo"
      estado_cita_enum:
        | "solicitada"
        | "en_gestion"
        | "confirmada"
        | "atendida"
        | "no_show"
        | "cancelada_paciente"
        | "cancelada_centro"
        | "reprogramada"
        | "rechazada"
      estado_lista_espera_enum:
        | "esperando"
        | "notificado"
        | "tomado"
        | "expirado"
        | "cancelado"
      estado_notificacion_enum:
        | "pendiente"
        | "enviada"
        | "fallida"
        | "cancelada"
      modo_agenda_enum: "exacto" | "bloque" | "solicitud"
      otorgado_por_enum: "paciente" | "representante"
      parentesco_convenio_enum:
        | "TITULAR"
        | "CONYUGE"
        | "HIJO"
        | "PADRE"
        | "MADRE"
        | "OTRO"
      resultado_solicitud_enum: "aceptada" | "rechazada" | "vencida"
      rol_usuario_enum: "admin" | "admisionista" | "medico"
      tipo_consentimiento_enum: "tratamiento_datos" | "marketing"
      tipo_documento_enum: "cedula" | "pasaporte"
      tipo_excepcion_enum: "feriado" | "vacaciones" | "ausencia" | "bloqueo"
      tipo_lista_precio_enum: "pvp" | "promocional" | "aseguradora" | "convenio"
      tipo_notificacion_enum:
        | "otp"
        | "confirmacion"
        | "recordatorio_24h"
        | "recordatorio_3h"
        | "encuesta"
        | "aviso_interno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accion_auditoria_enum: ["crear", "actualizar", "eliminar"],
      alcance_excepcion_enum: ["sede", "medico", "consultorio"],
      canal_cita_enum: ["web", "bot", "panel"],
      canal_notificacion_enum: ["whatsapp", "correo"],
      estado_cita_enum: [
        "solicitada",
        "en_gestion",
        "confirmada",
        "atendida",
        "no_show",
        "cancelada_paciente",
        "cancelada_centro",
        "reprogramada",
        "rechazada",
      ],
      estado_lista_espera_enum: [
        "esperando",
        "notificado",
        "tomado",
        "expirado",
        "cancelado",
      ],
      estado_notificacion_enum: [
        "pendiente",
        "enviada",
        "fallida",
        "cancelada",
      ],
      modo_agenda_enum: ["exacto", "bloque", "solicitud"],
      otorgado_por_enum: ["paciente", "representante"],
      parentesco_convenio_enum: [
        "TITULAR",
        "CONYUGE",
        "HIJO",
        "PADRE",
        "MADRE",
        "OTRO",
      ],
      resultado_solicitud_enum: ["aceptada", "rechazada", "vencida"],
      rol_usuario_enum: ["admin", "admisionista", "medico"],
      tipo_consentimiento_enum: ["tratamiento_datos", "marketing"],
      tipo_documento_enum: ["cedula", "pasaporte"],
      tipo_excepcion_enum: ["feriado", "vacaciones", "ausencia", "bloqueo"],
      tipo_lista_precio_enum: ["pvp", "promocional", "aseguradora", "convenio"],
      tipo_notificacion_enum: [
        "otp",
        "confirmacion",
        "recordatorio_24h",
        "recordatorio_3h",
        "encuesta",
        "aviso_interno",
      ],
    },
  },
} as const
