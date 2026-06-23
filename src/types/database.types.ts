export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_auth_user_id: string | null;
          actor_employee_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_auth_user_id?: string | null;
          actor_employee_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_auth_user_id?: string | null;
          actor_employee_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_employee_id_fk";
            columns: ["actor_employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          manager_employee_id: string | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          manager_employee_id?: string | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          manager_employee_id?: string | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_manager_employee_id_fk";
            columns: ["manager_employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          department_id: string;
          employee_code: string;
          full_name: string;
          id: string;
          join_date: string;
          manager_id: string | null;
          must_change_password: boolean;
          phone_number: string | null;
          position: string;
          role: Database["public"]["Enums"]["application_role"];
          status: Database["public"]["Enums"]["employment_status"];
          updated_at: string;
          work_email: string;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          department_id: string;
          employee_code: string;
          full_name: string;
          id?: string;
          join_date: string;
          manager_id?: string | null;
          must_change_password?: boolean;
          phone_number?: string | null;
          position: string;
          role?: Database["public"]["Enums"]["application_role"];
          status?: Database["public"]["Enums"]["employment_status"];
          updated_at?: string;
          work_email: string;
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          department_id?: string;
          employee_code?: string;
          full_name?: string;
          id?: string;
          join_date?: string;
          manager_id?: string | null;
          must_change_password?: boolean;
          phone_number?: string | null;
          position?: string;
          role?: Database["public"]["Enums"]["application_role"];
          status?: Database["public"]["Enums"]["employment_status"];
          updated_at?: string;
          work_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fk";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_manager_id_fk";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      holidays: {
        Row: {
          created_at: string;
          holiday_date: string;
          id: string;
          is_active: boolean;
          is_recurring: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          holiday_date: string;
          id?: string;
          is_active?: boolean;
          is_recurring?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          holiday_date?: string;
          id?: string;
          is_active?: boolean;
          is_recurring?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leave_balance_transactions: {
        Row: {
          actor_employee_id: string | null;
          created_at: string;
          days: number;
          id: string;
          leave_balance_id: string;
          leave_request_id: string | null;
          reason: string;
          transaction_type: Database["public"]["Enums"]["balance_transaction_type"];
        };
        Insert: {
          actor_employee_id?: string | null;
          created_at?: string;
          days: number;
          id?: string;
          leave_balance_id: string;
          leave_request_id?: string | null;
          reason?: string;
          transaction_type: Database["public"]["Enums"]["balance_transaction_type"];
        };
        Update: {
          actor_employee_id?: string | null;
          created_at?: string;
          days?: number;
          id?: string;
          leave_balance_id?: string;
          leave_request_id?: string | null;
          reason?: string;
          transaction_type?: Database["public"]["Enums"]["balance_transaction_type"];
        };
        Relationships: [
          {
            foreignKeyName: "lbt_actor_employee_id_fk";
            columns: ["actor_employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lbt_leave_balance_id_fk";
            columns: ["leave_balance_id"];
            isOneToOne: false;
            referencedRelation: "leave_balances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lbt_leave_request_id_fk";
            columns: ["leave_request_id"];
            isOneToOne: false;
            referencedRelation: "leave_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_balances: {
        Row: {
          adjustment_days: number;
          balance_year: number;
          created_at: string;
          employee_id: string;
          entitled_days: number;
          id: string;
          leave_type_id: string;
          pending_days: number;
          updated_at: string;
          used_days: number;
        };
        Insert: {
          adjustment_days?: number;
          balance_year: number;
          created_at?: string;
          employee_id: string;
          entitled_days?: number;
          id?: string;
          leave_type_id: string;
          pending_days?: number;
          updated_at?: string;
          used_days?: number;
        };
        Update: {
          adjustment_days?: number;
          balance_year?: number;
          created_at?: string;
          employee_id?: string;
          entitled_days?: number;
          id?: string;
          leave_type_id?: string;
          pending_days?: number;
          updated_at?: string;
          used_days?: number;
        };
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fk";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fk";
            columns: ["leave_type_id"];
            isOneToOne: false;
            referencedRelation: "leave_types";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_request_attachments: {
        Row: {
          created_at: string;
          id: string;
          leave_request_id: string;
          mime_type: string;
          original_name: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by_employee_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          leave_request_id: string;
          mime_type: string;
          original_name: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by_employee_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          leave_request_id?: string;
          mime_type?: string;
          original_name?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_by_employee_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_request_attachments_request_fk";
            columns: ["leave_request_id"];
            isOneToOne: false;
            referencedRelation: "leave_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_request_attachments_uploader_fk";
            columns: ["uploaded_by_employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_requests: {
        Row: {
          approver_employee_id: string | null;
          cancelled_at: string | null;
          created_at: string;
          decided_at: string | null;
          employee_id: string;
          end_date: string;
          id: string;
          leave_type_id: string;
          partial_day: Database["public"]["Enums"]["leave_partial_day"];
          reason: string;
          rejection_reason: string | null;
          request_number: string;
          requested_days: number;
          start_date: string;
          status: Database["public"]["Enums"]["leave_request_status"];
          updated_at: string;
        };
        Insert: {
          approver_employee_id?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          decided_at?: string | null;
          employee_id: string;
          end_date: string;
          id?: string;
          leave_type_id: string;
          partial_day?: Database["public"]["Enums"]["leave_partial_day"];
          reason?: string;
          rejection_reason?: string | null;
          request_number: string;
          requested_days: number;
          start_date: string;
          status?: Database["public"]["Enums"]["leave_request_status"];
          updated_at?: string;
        };
        Update: {
          approver_employee_id?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          decided_at?: string | null;
          employee_id?: string;
          end_date?: string;
          id?: string;
          leave_type_id?: string;
          partial_day?: Database["public"]["Enums"]["leave_partial_day"];
          reason?: string;
          rejection_reason?: string | null;
          request_number?: string;
          requested_days?: number;
          start_date?: string;
          status?: Database["public"]["Enums"]["leave_request_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_approver_employee_id_fk";
            columns: ["approver_employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_employee_id_fk";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fk";
            columns: ["leave_type_id"];
            isOneToOne: false;
            referencedRelation: "leave_types";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_types: {
        Row: {
          allow_negative_balance: boolean;
          code: string;
          color: string;
          created_at: string;
          deducts_balance: boolean;
          default_entitlement: number;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          requires_attachment: boolean;
          show_type_on_calendar: boolean;
          updated_at: string;
        };
        Insert: {
          allow_negative_balance?: boolean;
          code: string;
          color?: string;
          created_at?: string;
          deducts_balance?: boolean;
          default_entitlement?: number;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          requires_attachment?: boolean;
          show_type_on_calendar?: boolean;
          updated_at?: string;
        };
        Update: {
          allow_negative_balance?: boolean;
          code?: string;
          color?: string;
          created_at?: string;
          deducts_balance?: boolean;
          default_entitlement?: number;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          requires_attachment?: boolean;
          show_type_on_calendar?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          employee_id: string;
          id: string;
          is_read: boolean;
          message: string;
          notification_type: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          employee_id: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          notification_type: string;
          title: string;
        };
        Update: {
          created_at?: string;
          employee_id?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          notification_type?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_employee_id_fk";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      adjust_leave_balance: {
        Args: { p_balance_id: string; p_days: number; p_reason: string };
        Returns: Json;
      };
      approve_leave_request: { Args: { p_request_id: string }; Returns: Json };
      calculate_leave_days: {
        Args: {
          p_end_date: string;
          p_partial_day?: Database["public"]["Enums"]["leave_partial_day"];
          p_start_date: string;
        };
        Returns: number;
      };
      cancel_leave_request: { Args: { p_request_id: string }; Returns: Json };
      create_leave_request: {
        Args: {
          p_end_date: string;
          p_leave_type_id: string;
          p_partial_day?: Database["public"]["Enums"]["leave_partial_day"];
          p_reason?: string;
          p_start_date: string;
        };
        Returns: Json;
      };
      current_application_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["application_role"];
      };
      current_employee_id: { Args: never; Returns: string };
      generate_request_number: { Args: never; Returns: string };
      get_admin_dashboard: { Args: never; Returns: Json };
      get_attachment_download_url: {
        Args: { p_attachment_id: string };
        Returns: string;
      };
      get_calendar_events: {
        Args: {
          p_department_id?: string;
          p_employee_id?: string;
          p_end_date: string;
          p_leave_type_id?: string;
          p_start_date: string;
        };
        Returns: {
          color: string;
          department_id: string;
          department_name: string;
          employee_id: string;
          employee_name: string;
          end_date: string;
          leave_type_code: string;
          leave_type_id: string;
          partial_day: string;
          public_label: string;
          request_id: string;
          requested_days: number;
          start_date: string;
        }[];
      };
      get_employee_dashboard: { Args: never; Returns: Json };
      get_manager_dashboard: { Args: never; Returns: Json };
      initialize_employee_balances: {
        Args: { p_employee_id: string; p_year?: number };
        Returns: number;
      };
      is_admin: { Args: never; Returns: boolean };
      is_manager_of: { Args: { target_employee_id: string }; Returns: boolean };
      mark_all_notifications_read: { Args: never; Returns: undefined };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: undefined;
      };
      reject_leave_request: {
        Args: { p_rejection_reason: string; p_request_id: string };
        Returns: Json;
      };
      update_pending_leave_request: {
        Args: {
          p_end_date: string;
          p_leave_type_id: string;
          p_partial_day?: Database["public"]["Enums"]["leave_partial_day"];
          p_reason?: string;
          p_request_id: string;
          p_start_date: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      application_role: "ADMIN" | "MANAGER" | "EMPLOYEE";
      balance_transaction_type: "ENTITLEMENT" | "ADJUSTMENT" | "RESERVE" | "RELEASE" | "USE" | "REVERSE";
      employment_status: "ACTIVE" | "INACTIVE" | "TERMINATED";
      leave_partial_day: "NONE" | "FIRST_HALF" | "SECOND_HALF";
      leave_request_status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_role: ["ADMIN", "MANAGER", "EMPLOYEE"],
      balance_transaction_type: ["ENTITLEMENT", "ADJUSTMENT", "RESERVE", "RELEASE", "USE", "REVERSE"],
      employment_status: ["ACTIVE", "INACTIVE", "TERMINATED"],
      leave_partial_day: ["NONE", "FIRST_HALF", "SECOND_HALF"],
      leave_request_status: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
    },
  },
} as const;
