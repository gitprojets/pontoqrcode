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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_unidades: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          unidade_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          unidade_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_unidades_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_unidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_rules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          max_correcoes_mes: number
          prazo_correcao_dias: number
          tolerancia_entrada: number
          tolerancia_saida: number
          unidade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_correcoes_mes?: number
          prazo_correcao_dias?: number
          tolerancia_entrada?: number
          tolerancia_saida?: number
          unidade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_correcoes_mes?: number
          prazo_correcao_dias?: number
          tolerancia_entrada?: number
          tolerancia_saida?: number
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_rules_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: true
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dispositivo_api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          dispositivo_id: string
          encrypted_key: string
          id: string
          key_hint: string | null
          rotated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dispositivo_id: string
          encrypted_key: string
          id?: string
          key_hint?: string | null
          rotated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dispositivo_id?: string
          encrypted_key?: string
          id?: string
          key_hint?: string | null
          rotated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispositivo_api_keys_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: true
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositivos: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          leituras_hoje: number
          local: string | null
          nome: string
          status: string
          ultima_leitura: string | null
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          leituras_hoje?: number
          local?: string | null
          nome: string
          status?: string
          ultima_leitura?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          leituras_hoje?: number
          local?: string | null
          nome?: string
          status?: string
          ultima_leitura?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          assunto: string
          conteudo: string | null
          created_at: string
          erro_mensagem: string | null
          id: string
          sent_at: string | null
          status: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          assunto: string
          conteudo?: string | null
          created_at?: string
          erro_mensagem?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          assunto?: string
          conteudo?: string | null
          created_at?: string
          erro_mensagem?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas_trabalho: {
        Row: {
          created_at: string
          created_by: string | null
          dia_semana: number
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          is_folga: boolean
          observacao: string | null
          professor_id: string
          semana_inicio: string
          unidade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dia_semana: number
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          is_folga?: boolean
          observacao?: string | null
          professor_id: string
          semana_inicio: string
          unidade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dia_semana?: number
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          is_folga?: boolean
          observacao?: string | null
          professor_id?: string
          semana_inicio?: string
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalas_trabalho_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_trabalho_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_trabalho_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      justificativas: {
        Row: {
          anexo_nome: string | null
          anexo_path: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          professor_id: string
          status: string
          tipo: string
          unidade_id: string
          updated_at: string
        }
        Insert: {
          anexo_nome?: string | null
          anexo_path?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          professor_id: string
          status?: string
          tipo?: string
          unidade_id: string
          updated_at?: string
        }
        Update: {
          anexo_nome?: string | null
          anexo_path?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          professor_id?: string
          status?: string
          tipo?: string
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "justificativas_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justificativas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          foto: string | null
          id: string
          matricula: string | null
          nome: string
          unidade: string | null
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          foto?: string | null
          id: string
          matricula?: string | null
          nome: string
          unidade?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          foto?: string | null
          id?: string
          matricula?: string | null
          nome?: string
          unidade?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_nonces: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string
          professor_id: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          nonce: string
          professor_id: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string
          professor_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_nonces_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_frequencia: {
        Row: {
          created_at: string
          data_registro: string
          dispositivo_id: string | null
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          lido_por: string | null
          observacao: string | null
          professor_id: string
          status: string
          unidade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_registro?: string
          dispositivo_id?: string | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          lido_por?: string | null
          observacao?: string | null
          professor_id: string
          status?: string
          unidade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_registro?: string
          dispositivo_id?: string | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          lido_por?: string | null
          observacao?: string | null
          professor_id?: string
          status?: string
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_frequencia_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_frequencia_lido_por_fkey"
            columns: ["lido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_frequencia_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_frequencia_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      school_events: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          is_global: boolean
          tipo: string
          titulo: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          is_global?: boolean
          tipo?: string
          titulo: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          is_global?: boolean
          tipo?: string
          titulo?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_events_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          created_at: string
          dias_funcionamento: number[] | null
          diretor_id: string | null
          endereco: string | null
          hora_abertura: string | null
          hora_fechamento: string | null
          id: string
          nome: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dias_funcionamento?: number[] | null
          diretor_id?: string | null
          endereco?: string | null
          hora_abertura?: string | null
          hora_fechamento?: string | null
          id?: string
          nome: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dias_funcionamento?: number[] | null
          diretor_id?: string | null
          endereco?: string | null
          hora_abertura?: string | null
          hora_fechamento?: string | null
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_diretor_id_fkey"
            columns: ["diretor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_summary: boolean
          id: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          presence_alerts: boolean
          push_enabled: boolean
          reminders: boolean
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_summary?: boolean
          id?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          presence_alerts?: boolean
          push_enabled?: boolean
          reminders?: boolean
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_summary?: boolean
          id?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          presence_alerts?: boolean
          push_enabled?: boolean
          reminders?: boolean
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_user: {
        Args: {
          _email: string
          _matricula?: string
          _nome: string
          _password: string
          _role?: Database["public"]["Enums"]["app_role"]
          _unidade_id?: string
        }
        Returns: string
      }
      can_view_full_email: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      cleanup_expired_nonces: { Args: never; Returns: undefined }
      count_audit_logs: {
        Args: { p_action_filter?: string; p_table_filter?: string }
        Returns: number
      }
      get_admin_unit_ids: { Args: { _user_id: string }; Returns: string[] }
      get_audit_logs_masked: {
        Args: {
          p_action_filter?: string
          p_limit?: number
          p_offset?: number
          p_table_filter?: string
        }
        Returns: {
          action: string
          created_at: string
          id: string
          ip_address: string
          new_data: Json
          old_data: Json
          record_id: string
          table_name: string
          user_agent: string
          user_id: string
        }[]
      }
      get_decrypted_api_key: {
        Args: { p_dispositivo_id: string }
        Returns: string
      }
      get_dispositivo_api_key: {
        Args: { dispositivo_id: string }
        Returns: string
      }
      get_dispositivos_safe: {
        Args: never
        Returns: {
          created_at: string
          id: string
          leituras_hoje: number
          local: string
          nome: string
          status: string
          ultima_leitura: string
          unidade_id: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_unit_id: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_for_unit: {
        Args: { _unidade_id: string; _user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _new_data?: Json
          _old_data?: Json
          _record_id?: string
          _table_name?: string
        }
        Returns: string
      }
      mask_sensitive_data: { Args: { data: Json }; Returns: Json }
      set_encrypted_api_key: {
        Args: { p_api_key: string; p_dispositivo_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "professor"
        | "diretor"
        | "administrador"
        | "desenvolvedor"
        | "coordenador"
        | "secretario"
        | "outro"
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
      app_role: [
        "professor",
        "diretor",
        "administrador",
        "desenvolvedor",
        "coordenador",
        "secretario",
        "outro",
      ],
    },
  },
} as const
