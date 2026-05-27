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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_time: string | null
          created_at: string
          details: string | null
          guard_id: string | null
          guard_name: string | null
          guard_phone: string | null
          handled_by: string | null
          id: string
          installation_name: string | null
          location: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          alert_time?: string | null
          created_at?: string
          details?: string | null
          guard_id?: string | null
          guard_name?: string | null
          guard_phone?: string | null
          handled_by?: string | null
          id?: string
          installation_name?: string | null
          location?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          alert_time?: string | null
          created_at?: string
          details?: string | null
          guard_id?: string | null
          guard_name?: string | null
          guard_phone?: string | null
          handled_by?: string | null
          id?: string
          installation_name?: string | null
          location?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          companyName: string | null
          darkPrimaryColor: string | null
          googleMapsKey: string | null
          id: number
          lightPrimaryColor: string | null
          logo: string | null
          supabaseKey: string | null
          supabaseUrl: string | null
          updated_at: string | null
        }
        Insert: {
          companyName?: string | null
          darkPrimaryColor?: string | null
          googleMapsKey?: string | null
          id?: number
          lightPrimaryColor?: string | null
          logo?: string | null
          supabaseKey?: string | null
          supabaseUrl?: string | null
          updated_at?: string | null
        }
        Update: {
          companyName?: string | null
          darkPrimaryColor?: string | null
          googleMapsKey?: string | null
          id?: number
          lightPrimaryColor?: string | null
          logo?: string | null
          supabaseKey?: string | null
          supabaseUrl?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guard_rounds: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          checkpoints_scanned: number | null
          completion_percentage: number | null
          created_at: string | null
          guard_id: string
          id: string
          installation_id: string
          round_number: number
          route_tracking_id: string | null
          scheduled_start: string | null
          shift_date: string
          status: string | null
          total_checkpoints: number | null
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          checkpoints_scanned?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          guard_id: string
          id?: string
          installation_id: string
          round_number: number
          route_tracking_id?: string | null
          scheduled_start?: string | null
          shift_date: string
          status?: string | null
          total_checkpoints?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          checkpoints_scanned?: number | null
          completion_percentage?: number | null
          created_at?: string | null
          guard_id?: string
          id?: string
          installation_id?: string
          round_number?: number
          route_tracking_id?: string | null
          scheduled_start?: string | null
          shift_date?: string
          status?: string | null
          total_checkpoints?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guard_rounds_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_rounds_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guard_rounds_route_tracking_id_fkey"
            columns: ["route_tracking_id"]
            isOneToOne: false
            referencedRelation: "route_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      guards: {
        Row: {
          assigned_installation_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          os10_expiry: string | null
          password: string | null
          phone: string | null
          rut: string | null
          shift: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_installation_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          os10_expiry?: string | null
          password?: string | null
          phone?: string | null
          rut?: string | null
          shift?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_installation_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          os10_expiry?: string | null
          password?: string | null
          phone?: string | null
          rut?: string | null
          shift?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guards_assigned_installation_id_fkey"
            columns: ["assigned_installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string | null
          description: string | null
          guard_id: string | null
          guard_name: string | null
          id: string
          installation_id: string | null
          installation_name: string | null
          photos: string[] | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          guard_id?: string | null
          guard_name?: string | null
          id?: string
          installation_id?: string | null
          installation_name?: string | null
          photos?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          guard_id?: string | null
          guard_name?: string | null
          id?: string
          installation_id?: string | null
          installation_name?: string | null
          photos?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      installations: {
        Row: {
          address: string
          checkpoint_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          lat: number
          lng: number
          name: string
          required_daily_scans: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          checkpoint_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lat: number
          lng: number
          name: string
          required_daily_scans?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          checkpoint_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number
          lng?: number
          name?: string
          required_daily_scans?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          checkpoint_id: string | null
          created_at: string | null
          detail: string | null
          distance_to_checkpoint: number | null
          gps_accuracy: number | null
          gps_verified: boolean | null
          guard_id: string
          guard_name: string | null
          id: string
          installation_id: string
          installation_name: string | null
          latitude: number | null
          longitude: number | null
          patrol_session_id: string | null
          photos: string[] | null
          point_name: string | null
          tag_id: string | null
          timestamp: string | null
          title: string | null
          type: Database["public"]["Enums"]["log_type"]
        }
        Insert: {
          checkpoint_id?: string | null
          created_at?: string | null
          detail?: string | null
          distance_to_checkpoint?: number | null
          gps_accuracy?: number | null
          gps_verified?: boolean | null
          guard_id: string
          guard_name?: string | null
          id?: string
          installation_id: string
          installation_name?: string | null
          latitude?: number | null
          longitude?: number | null
          patrol_session_id?: string | null
          photos?: string[] | null
          point_name?: string | null
          tag_id?: string | null
          timestamp?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["log_type"]
        }
        Update: {
          checkpoint_id?: string | null
          created_at?: string | null
          detail?: string | null
          distance_to_checkpoint?: number | null
          gps_accuracy?: number | null
          gps_verified?: boolean | null
          guard_id?: string
          guard_name?: string | null
          id?: string
          installation_id?: string
          installation_name?: string | null
          latitude?: number | null
          longitude?: number | null
          patrol_session_id?: string | null
          photos?: string[] | null
          point_name?: string | null
          tag_id?: string | null
          timestamp?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["log_type"]
        }
        Relationships: [
          {
            foreignKeyName: "logs_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "qr_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_patrol_session_id_fkey"
            columns: ["patrol_session_id"]
            isOneToOne: false
            referencedRelation: "patrol_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          message: string
          read: boolean | null
          timestamp: string | null
          title: string
          type: string
        }
        Insert: {
          id?: string
          message: string
          read?: boolean | null
          timestamp?: string | null
          title: string
          type: string
        }
        Update: {
          id?: string
          message?: string
          read?: boolean | null
          timestamp?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      patrol_sessions: {
        Row: {
          checkpoints_scanned: number
          completed_at: string | null
          created_at: string
          guard_id: string
          id: string
          notes: string | null
          round_number: number
          route_id: string
          started_at: string
          status: string
          total_checkpoints: number
        }
        Insert: {
          checkpoints_scanned?: number
          completed_at?: string | null
          created_at?: string
          guard_id: string
          id?: string
          notes?: string | null
          round_number?: number
          route_id: string
          started_at?: string
          status?: string
          total_checkpoints?: number
        }
        Update: {
          checkpoints_scanned?: number
          completed_at?: string | null
          created_at?: string | null
          guard_id?: string
          id?: string
          notes?: string | null
          round_number?: number
          route_id?: string
          started_at?: string
          status?: string
          total_checkpoints?: number
        }
        Relationships: [
          {
            foreignKeyName: "patrol_sessions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_connected: boolean | null
          last_login: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          is_connected?: boolean | null
          last_login?: string | null
          phone?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_connected?: boolean | null
          last_login?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_checkpoints: {
        Row: {
          checkpoint_type: string
          created_at: string | null
          description: string | null
          id: string
          installation_id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          nfc_id: string | null
          order_sequence: number | null
          qr_code: string | null
          route_id: string | null
          updated_at: string | null
          validation_radius_meters: number | null
        }
        Insert: {
          checkpoint_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          installation_id: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          nfc_id?: string | null
          order_sequence?: number | null
          qr_code?: string | null
          route_id?: string | null
          updated_at?: string | null
          validation_radius_meters?: number | null
        }
        Update: {
          checkpoint_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          installation_id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          nfc_id?: string | null
          order_sequence?: number | null
          qr_code?: string | null
          route_id?: string | null
          updated_at?: string | null
          validation_radius_meters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_checkpoints_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_checkpoints_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          guard_id: string | null
          id: string
          images: string[] | null
          installation: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          guard_id?: string | null
          id?: string
          images?: string[] | null
          installation?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          guard_id?: string | null
          id?: string
          images?: string[] | null
          installation?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_code: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_code: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_code?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["code"]
          },
        ]
      }
      route_tracking: {
        Row: {
          average_speed_kmh: number | null
          breadcrumbs: Json
          compliance_score: number | null
          created_at: string | null
          duration_seconds: number | null
          end_time: string | null
          fraud_flags: Json | null
          guard_id: string
          id: string
          installation_id: string
          is_valid: boolean | null
          round_number: number
          shift_date: string
          start_time: string
          total_distance_meters: number | null
          updated_at: string | null
        }
        Insert: {
          average_speed_kmh?: number | null
          breadcrumbs?: Json
          compliance_score?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          fraud_flags?: Json | null
          guard_id: string
          id?: string
          installation_id: string
          is_valid?: boolean | null
          round_number: number
          shift_date: string
          start_time: string
          total_distance_meters?: number | null
          updated_at?: string | null
        }
        Update: {
          average_speed_kmh?: number | null
          breadcrumbs?: Json
          compliance_score?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          fraud_flags?: Json | null
          guard_id?: string
          id?: string
          installation_id?: string
          is_valid?: boolean | null
          round_number?: number
          shift_date?: string
          start_time?: string
          total_distance_meters?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_tracking_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "guards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_tracking_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          id: string
          installation_id: string | null
          is_active: boolean | null
          name: string
          rounds_per_shift: number
        }
        Insert: {
          created_at?: string
          id?: string
          installation_id?: string | null
          is_active?: boolean | null
          name: string
          rounds_per_shift?: number
        }
        Update: {
          created_at?: string
          id?: string
          installation_id?: string | null
          is_active?: boolean | null
          name?: string
          rounds_per_shift?: number
        }
        Relationships: [
          {
            foreignKeyName: "routes_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          installation: string
          notes: string | null
          start_time: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          installation: string
          notes?: string | null
          start_time: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          installation?: string
          notes?: string | null
          start_time?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      supervisors: {
        Row: {
          assigned_installation_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          os10_expiry: string | null
          password: string | null
          phone: string | null
          rut: string | null
          shift: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_installation_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          os10_expiry?: string | null
          password?: string | null
          phone?: string | null
          rut?: string | null
          shift?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_installation_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          os10_expiry?: string | null
          password?: string | null
          phone?: string | null
          rut?: string | null
          shift?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisors_assigned_installation_id_fkey"
            columns: ["assigned_installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password?: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password?: string | null
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_gps_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      check_user_role: { Args: { target_roles: string[] }; Returns: boolean }
      delete_old_logs: { Args: never; Returns: undefined }
      find_auth_user_by_email: {
        Args: { lookup_email: string }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_installations_with_counts: {
        Args: never
        Returns: {
          address: string
          alerts_count: number
          created_at: string
          id: string
          is_active: boolean
          lat: number
          lng: number
          logs_count: number
          name: string
          reports_count: number
          required_daily_scans: number
          updated_at: string
        }[]
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: {
          permission_code: string
        }[]
      }
      has_permission: {
        Args: { permission: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_role: "Admin" | "Super Admin"
      log_type: "QR" | "NFC" | "INCIDENT" | "SOS"
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
      admin_role: ["Admin", "Super Admin"],
      log_type: ["QR", "NFC", "INCIDENT", "SOS"],
    },
  },
} as const
