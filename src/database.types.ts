export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      casillas: {
        Row: {
          casilla: string | null
          casilla_id: number
          df: number | null
          dl: number | null
          id: number
          municipio: number | null
          seccion_id: number | null
          ubicación: string | null
          capturista_id: number | null
        }
        Insert: {
          casilla?: string | null
          casilla_id?: number
          df?: number | null
          dl?: number | null
          id?: number
          municipio?: number | null
          seccion_id?: number | null
          ubicación?: string | null
          capturista_id?: number | null
        }
        Update: {
          casilla?: string | null
          casilla_id?: number
          df?: number | null
          dl?: number | null
          id?: number
          municipio?: number | null
          seccion_id?: number | null
          ubicación?: string | null
          capturista_id?: number | null
        }
        Relationships: []
      }
      df: {
        Row: {
          df: number | null
          id: number
        }
        Insert: {
          df?: number | null
          id?: number
        }
        Update: {
          df?: number | null
          id?: number
        }
        Relationships: []
      }
      dl: {
        Row: {
          dl: number | null
          id: number
        }
        Insert: {
          dl?: number | null
          id?: number
        }
        Update: {
          dl?: number | null
          id?: number
        }
        Relationships: []
      }
      municipios: {
        Row: {
          id: number
          municipio: string | null
        }
        Insert: {
          id?: number
          municipio?: string | null
        }
        Update: {
          id?: number
          municipio?: string | null
        }
        Relationships: []
      }
      rc: {
        Row: {
          apellido_materno: string | null
          apellido_paterno: string
          autoriza_propaganda: boolean
          calle: string | null
          casilla_id: number | null
          cic: string | null
          clave_elector: string
          codigo_postal: string | null
          colonia: string | null
          correo_electronico: string | null
          credencial_vigente: boolean
          df_id: number
          dl_id: number
          es_militante: boolean
          firma_capturada: boolean
          id: number
          nombre: string
          num_ext: string | null
          num_int: string | null
          numero_credencial: string
          seccion_id: number
          telefono: string | null
          tipo_nombramiento: Database["public"]["Enums"]["tipo_nombramiento"]
          tipo_propaganda: Database["public"]["Enums"]["tipo_propaganda"] | null
          capturista_id: number | null
        }
        Insert: {
          apellido_materno?: string | null
          apellido_paterno: string
          autoriza_propaganda?: boolean
          calle?: string | null
          casilla_id?: number | null
          cic?: string | null
          clave_elector: string
          codigo_postal?: string | null
          colonia?: string | null
          correo_electronico?: string | null
          credencial_vigente?: boolean
          user_id?: string | null
          df_id: number
          dl_id: number
          es_militante?: boolean
          firma_capturada?: boolean
          id?: number
          nombre: string
          num_ext?: string | null
          num_int?: string | null
          numero_credencial: string
          seccion_id: number
          telefono?: string | null
          tipo_nombramiento: Database["public"]["Enums"]["tipo_nombramiento"]
          tipo_propaganda?: Database["public"]["Enums"]["tipo_propaganda"] | null
          capturista_id?: number | null
        }
        Update: {
          apellido_materno?: string | null
          apellido_paterno?: string
          autoriza_propaganda?: boolean
          calle?: string | null
          casilla_id?: number | null
          cic?: string | null
          clave_elector?: string
          codigo_postal?: string | null
          colonia?: string | null
          correo_electronico?: string | null
          credencial_vigente?: boolean
          df_id?: number
          dl_id?: number
          es_militante?: boolean
          firma_capturada?: boolean
          id?: number
          nombre?: string
          num_ext?: string | null
          num_int?: string | null
          numero_credencial?: string
          seccion_id?: number
          telefono?: string | null
          tipo_nombramiento?: Database["public"]["Enums"]["tipo_nombramiento"]
          tipo_propaganda?: Database["public"]["Enums"]["tipo_propaganda"] | null
          capturista_id?: number | null
        }
        Relationships: []
      }
      rg: {
        Row: {
          apellido_materno: string | null
          apellido_paterno: string
          autoriza_propaganda: boolean
          calle: string | null
          cic: string | null
          clave_elector: string
          codigo_postal: string | null
          colonia: string | null
          correo_electronico: string | null
          credencial_vigente: boolean
          df_id: number
          dl_id: number
          es_militante: boolean
          firma_capturada: boolean
          id: number
          nombre: string
          num_ext: string | null
          num_int: string | null
          numero_credencial: string
          seccion_id: number
          telefono: string | null
          tipo_propaganda: Database["public"]["Enums"]["tipo_propaganda"] | null
          capturista_id: number | null
        }
        Insert: {
          apellido_materno?: string | null
          apellido_paterno: string
          autoriza_propaganda?: boolean
          calle?: string | null
          cic?: string | null
          clave_elector: string
          codigo_postal?: string | null
          colonia?: string | null
          correo_electronico?: string | null
          credencial_vigente?: boolean
          df_id: number
          dl_id: number
          es_militante?: boolean
          firma_capturada?: boolean
          id?: number
          nombre: string
          num_ext?: string | null
          num_int?: string | null
          numero_credencial: string
          seccion_id: number
          telefono?: string | null
          tipo_propaganda?: Database["public"]["Enums"]["tipo_propaganda"] | null
          capturista_id?: number | null
        }
        Update: {
          apellido_materno?: string | null
          apellido_paterno?: string
          autoriza_propaganda?: boolean
          calle?: string | null
          cic?: string | null
          clave_elector?: string
          codigo_postal?: string | null
          colonia?: string | null
          correo_electronico?: string | null
          credencial_vigente?: boolean
          df_id?: number
          dl_id?: number
          es_militante?: boolean
          firma_capturada?: boolean
          id?: number
          nombre?: string
          num_ext?: string | null
          num_int?: string | null
          numero_credencial?: string
          seccion_id?: number
          telefono?: string | null
          tipo_propaganda?: Database["public"]["Enums"]["tipo_propaganda"] | null
          capturista_id?: number | null
        }
        Relationships: []
      }
      rutas: {
        Row: {
          df_id: number | null
          dl_id: number
          id: number
          nombre_ruta: string
          representante_general_id: number | null
          casillas_asignada: Json
          municipio_id: number | null
          capturista_id: number | null
        }
        Insert: {
          df_id?: number | null
          dl_id: number
          id?: number
          nombre_ruta: string
          representante_general_id?: number | null
          casillas_asignada: Json
          municipio_id?: number | null
          capturista_id?: number | null
        }
        Update: {
          df_id?: number | null
          dl_id?: number
          id?: number
          nombre_ruta?: string
          representante_general_id?: number | null
          casillas_asignada?: Json
          municipio_id?: number | null
          capturista_id?: number | null
        }
        Relationships: []
      }
      secciones: {
        Row: {
          df_id: number | null
          dl_id: number | null
          id: number
          municipio_id: number | null
        }
        Insert: {
          df_id?: number | null
          dl_id?: number | null
          id?: number
          municipio_id?: number | null
        }
        Update: {
          df_id?: number | null
          dl_id?: number | null
          id?: number
          municipio_id?: number | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: number
          usuario: string
          password: string
          rol: string | null
          nombre_completo: string | null
        }
        Insert: {
          id?: number
          usuario: string
          password: string
          rol?: string | null
          nombre_completo?: string | null
        }
        Update: {
          id?: number
          usuario?: string
          password?: string
          rol?: string | null
          nombre_completo?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_login: {
        Args: {
          p_usuario: string
          p_contrasena: string
        }
        Returns: {
          id: number
          usuario: string
          rol: string
          nombre_completo: string
        }
      }
      save_user: {
        Args: {
          p_id: number
          p_usuario: string
          p_password: string
          p_rol: string
          p_nombre_completo: string
        }
        Returns: {
          id: number
          usuario: string
          password: string
          rol: string | null
          nombre_completo: string | null
        }
      }
      verify_user_password: {
        Args: {
          p_usuario: string
          p_password: string
        }
        Returns: any
      }
      save_rg_secure: {
        Args: {
          p_id: number | null
          p_payload: any
        }
        Returns: any
      }
      save_rc_secure: {
        Args: {
          p_id: number | null
          p_payload: any
        }
        Returns: any
      }
      save_ruta_secure: {
        Args: {
          p_id: number | null
          p_payload: any
        }
        Returns: any
      }
      save_casilla_secure: {
        Args: {
          p_id: number | null
          p_payload: any
        }
        Returns: any
      }
    }
    Enums: {
      tipo_nombramiento: "PROPIETARIO 1" | "PROPIETARIO 2" | "SUPLENTE 1" | "SUPLENTE 2"
      tipo_propaganda: "Ninguno" | "Lona" | "Pinta de Barda" | "Otro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never
