// 생성물 — 직접 고치지 않는다 (GC-06-002).
// 정본 명령: supabase gen types typescript --local > apps/web/types/supabase.ts  (Docker Desktop 필요)
// 대체 명령: node scripts/db/gen-types.mjs  (PGlite 로 supabase/migrations 를 적용해 같은 모양으로 생성)
// 입력: 20261025000001_core_lite.sql, 20261025000002_gc_domain_r1.sql
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_usage: {
        Row: {
          app_id: string | null
          audio_seconds: number | null
          characters: number | null
          conversation_id: string | null
          cost_usd_micros: number
          created_at: string
          credits: number
          error_code: string | null
          feature: string | null
          id: number
          input_tokens: number
          kind: string
          latency_ms: number | null
          ledger_id: number | null
          model: string
          org_id: string
          output_tokens: number
          provider: string
          purpose: string | null
          request_id: string | null
          run_id: string | null
          settled_at: string | null
          source: string | null
          status: string
        }
        Insert: {
          app_id?: string | null
          audio_seconds?: number | null
          characters?: number | null
          conversation_id?: string | null
          cost_usd_micros?: number
          created_at?: string
          credits?: number
          error_code?: string | null
          feature?: string | null
          id?: never
          input_tokens?: number
          kind?: string
          latency_ms?: number | null
          ledger_id?: number | null
          model: string
          org_id: string
          output_tokens?: number
          provider: string
          purpose?: string | null
          request_id?: string | null
          run_id?: string | null
          settled_at?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          app_id?: string | null
          audio_seconds?: number | null
          characters?: number | null
          conversation_id?: string | null
          cost_usd_micros?: number
          created_at?: string
          credits?: number
          error_code?: string | null
          feature?: string | null
          id?: never
          input_tokens?: number
          kind?: string
          latency_ms?: number | null
          ledger_id?: number | null
          model?: string
          org_id?: string
          output_tokens?: number
          provider?: string
          purpose?: string | null
          request_id?: string | null
          run_id?: string | null
          settled_at?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_entitlements: {
        Row: {
          app_id: string
          created_at: string
          expires_at: string | null
          granted_by: string | null
          note: string | null
          org_id: string
          plan_id: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          note?: string | null
          org_id: string
          plan_id: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          note?: string | null
          org_id?: string
          plan_id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_entitlements_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_entitlements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_entitlements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          created_at: string
          id: string
          name: string
          schema_name: string
          signup_policy: string
          status: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          schema_name: string
          signup_policy?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          schema_name?: string
          signup_policy?: string
          status?: string
        }
        Relationships: []
      }
      audio_tracks: {
        Row: {
          bytes: number | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          file_status: string
          id: string
          is_active: boolean
          license_note: string | null
          mime_type: string | null
          mood_tags: string[]
          org_id: string | null
          source: string
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          file_status?: string
          id?: string
          is_active?: boolean
          license_note?: string | null
          mime_type?: string | null
          mood_tags?: string[]
          org_id?: string | null
          source?: string
          storage_path: string
          title: string
          updated_at?: string
        }
        Update: {
          bytes?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          file_status?: string
          id?: string
          is_active?: boolean
          license_note?: string | null
          mime_type?: string | null
          mood_tags?: string[]
          org_id?: string | null
          source?: string
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_tracks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          ip: string | null
          metadata: Json
          org_id: string | null
          request_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          ip?: string | null
          metadata?: Json
          org_id?: string | null
          request_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          ip?: string | null
          metadata?: Json
          org_id?: string | null
          request_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          action: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          note: string | null
          org_id: string | null
          replacement: string | null
          severity: string
          updated_at: string
          word: string
        }
        Insert: {
          action?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          org_id?: string | null
          replacement?: string | null
          severity?: string
          updated_at?: string
          word: string
        }
        Update: {
          action?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          org_id?: string | null
          replacement?: string | null
          severity?: string
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "banned_words_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_keys: {
        Row: {
          billing_key_ciphertext: string
          card_company: string | null
          card_number_masked: string | null
          created_at: string
          created_by: string | null
          customer_key: string
          id: string
          key_version: number
          org_id: string
          revoked_at: string | null
          status: string
        }
        Insert: {
          billing_key_ciphertext: string
          card_company?: string | null
          card_number_masked?: string | null
          created_at?: string
          created_by?: string | null
          customer_key: string
          id?: string
          key_version?: number
          org_id: string
          revoked_at?: string | null
          status?: string
        }
        Update: {
          billing_key_ciphertext?: string
          card_company?: string | null
          card_number_masked?: string | null
          created_at?: string
          created_by?: string | null
          customer_key?: string
          id?: string
          key_version?: number
          org_id?: string
          revoked_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          actor_id: string | null
          amount: number
          app_id: string | null
          balance_after: number
          created_at: string
          entry_type: string
          id: number
          idempotency_key: string | null
          metadata: Json
          org_id: string
          pack_delta: number
          plan_delta: number
          reason: string
          ref_id: string | null
          ref_type: string | null
          refund_of: number | null
        }
        Insert: {
          actor_id?: string | null
          amount: number
          app_id?: string | null
          balance_after: number
          created_at?: string
          entry_type: string
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          org_id: string
          pack_delta?: number
          plan_delta?: number
          reason: string
          ref_id?: string | null
          ref_type?: string | null
          refund_of?: number | null
        }
        Update: {
          actor_id?: string | null
          amount?: number
          app_id?: string | null
          balance_after?: number
          created_at?: string
          entry_type?: string
          id?: never
          idempotency_key?: string | null
          metadata?: Json
          org_id?: string
          pack_delta?: number
          plan_delta?: number
          reason?: string
          ref_id?: string | null
          ref_type?: string | null
          refund_of?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_refund_of_fkey"
            columns: ["refund_of"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          app_id: string
          code: string
          created_at: string
          credits: number
          id: string
          is_active: boolean
          name: string
          price_krw: number
          sort_order: number
        }
        Insert: {
          app_id: string
          code: string
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          name: string
          price_krw: number
          sort_order?: number
        }
        Update: {
          app_id?: string
          code?: string
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          name?: string
          price_krw?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_packs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      detail_pages: {
        Row: {
          autosaved_at: string | null
          blocks: Json
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          credit_ledger_id: number | null
          credits_charged: number
          edit_revision: number
          error_message: string | null
          error_stage: string | null
          html_content: string | null
          id: string
          issues: Json
          job_id: string | null
          org_id: string
          product_id: string
          request_id: string | null
          shipping_attached: boolean
          shipping_template_id: string | null
          status: string
          updated_at: string
          verdict: string | null
          verdict_checked_at: string | null
          version: number
          warn_acknowledged_at: string | null
          warn_acknowledged_by: string | null
        }
        Insert: {
          autosaved_at?: string | null
          blocks?: Json
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          credits_charged?: number
          edit_revision?: number
          error_message?: string | null
          error_stage?: string | null
          html_content?: string | null
          id?: string
          issues?: Json
          job_id?: string | null
          org_id: string
          product_id: string
          request_id?: string | null
          shipping_attached?: boolean
          shipping_template_id?: string | null
          status?: string
          updated_at?: string
          verdict?: string | null
          verdict_checked_at?: string | null
          version?: number
          warn_acknowledged_at?: string | null
          warn_acknowledged_by?: string | null
        }
        Update: {
          autosaved_at?: string | null
          blocks?: Json
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          credits_charged?: number
          edit_revision?: number
          error_message?: string | null
          error_stage?: string | null
          html_content?: string | null
          id?: string
          issues?: Json
          job_id?: string | null
          org_id?: string
          product_id?: string
          request_id?: string | null
          shipping_attached?: boolean
          shipping_template_id?: string | null
          status?: string
          updated_at?: string
          verdict?: string | null
          verdict_checked_at?: string | null
          version?: number
          warn_acknowledged_at?: string | null
          warn_acknowledged_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detail_pages_credit_ledger_id_fkey"
            columns: ["credit_ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_pages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_pages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detail_pages_product_fk"
            columns: ["org_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "detail_pages_template_fk"
            columns: ["org_id", "shipping_template_id"]
            isOneToOne: false
            referencedRelation: "shipping_templates"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      encrypted_credentials: {
        Row: {
          app_id: string
          ciphertext: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          external_account_id: string
          id: string
          key_version: number
          label: string | null
          last_error: string | null
          last_refreshed_at: string | null
          org_id: string
          provider: string
          scopes: string[]
          status: string
          updated_at: string
        }
        Insert: {
          app_id: string
          ciphertext: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          external_account_id?: string
          id?: string
          key_version: number
          label?: string | null
          last_error?: string | null
          last_refreshed_at?: string | null
          org_id: string
          provider: string
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          ciphertext?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          external_account_id?: string
          id?: string
          key_version?: number
          label?: string | null
          last_error?: string | null
          last_refreshed_at?: string | null
          org_id?: string
          provider?: string
          scopes?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_credentials_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encrypted_credentials_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      export_files: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          expires_at: string | null
          file_bytes: number | null
          id: string
          job_id: string | null
          kind: string
          market: string | null
          org_id: string
          product_ids: string[]
          row_count: number | null
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_bytes?: number | null
          id?: string
          job_id?: string | null
          kind: string
          market?: string | null
          org_id: string
          product_ids: string[]
          row_count?: number | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_bytes?: number | null
          id?: string
          job_id?: string | null
          kind?: string
          market?: string | null
          org_id?: string
          product_ids?: string[]
          row_count?: number | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_files_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          currency: string
          fetched_at: string
          id: number
          rate_date: string
          rate_krw: number
          source: string
          unit: number
        }
        Insert: {
          currency: string
          fetched_at?: string
          id?: never
          rate_date: string
          rate_krw: number
          source?: string
          unit?: number
        }
        Update: {
          currency?: string
          fetched_at?: string
          id?: never
          rate_date?: string
          rate_krw?: number
          source?: string
          unit?: number
        }
        Relationships: []
      }
      import_rows: {
        Row: {
          cell_errors: Json
          created_at: string
          exclude_reason: string | null
          id: string
          import_id: string
          org_id: string
          product_id: string | null
          raw: Json
          row_no: number
          source_ref: string | null
          source_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cell_errors?: Json
          created_at?: string
          exclude_reason?: string | null
          id?: string
          import_id: string
          org_id: string
          product_id?: string | null
          raw?: Json
          row_no: number
          source_ref?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cell_errors?: Json
          created_at?: string
          exclude_reason?: string | null
          id?: string
          import_id?: string
          org_id?: string
          product_id?: string | null
          raw?: Json
          row_no?: number
          source_ref?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_import_fk"
            columns: ["org_id", "import_id"]
            isOneToOne: false
            referencedRelation: "source_imports"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "import_rows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_product_fk"
            columns: ["org_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      jobs: {
        Row: {
          app_id: string
          attempts: number
          created_at: string
          created_by: string | null
          credit_ledger_id: number | null
          finished_at: string | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          org_id: string
          parent_job_id: string | null
          payload: Json
          priority: number
          progress: number
          progress_message: string | null
          queue: string
          refund_on_failure: boolean
          result: Json | null
          run_after: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          app_id: string
          attempts?: number
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          org_id: string
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          progress?: number
          progress_message?: string | null
          queue?: string
          refund_on_failure?: boolean
          result?: Json | null
          run_after?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          attempts?: number
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          org_id?: string
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          progress?: number
          progress_message?: string | null
          queue?: string
          refund_on_failure?: boolean
          result?: Json | null
          run_after?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_credit_ledger_id_fkey"
            columns: ["credit_ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      market_accounts: {
        Row: {
          created_at: string
          created_by: string | null
          credential_id: string | null
          expires_at: string | null
          id: string
          key_hint: string | null
          label: string
          last_error: string | null
          last_verified_at: string | null
          market: string
          org_id: string
          status: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credential_id?: string | null
          expires_at?: string | null
          id?: string
          key_hint?: string | null
          label: string
          last_error?: string | null
          last_verified_at?: string | null
          market: string
          org_id: string
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credential_id?: string | null
          expires_at?: string | null
          id?: string
          key_hint?: string | null
          label?: string
          last_error?: string | null
          last_verified_at?: string | null
          market?: string
          org_id?: string
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_accounts_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "encrypted_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_images: {
        Row: {
          bytes: number | null
          created_at: string
          detail_page_id: string
          format: string | null
          height: number | null
          id: string
          kind: string
          market: string
          org_id: string
          part_no: number
          storage_path: string
          validation: Json
          width: number | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          detail_page_id: string
          format?: string | null
          height?: number | null
          id?: string
          kind: string
          market: string
          org_id: string
          part_no?: number
          storage_path: string
          validation?: Json
          width?: number | null
        }
        Update: {
          bytes?: number | null
          created_at?: string
          detail_page_id?: string
          format?: string | null
          height?: number | null
          id?: string
          kind?: string
          market?: string
          org_id?: string
          part_no?: number
          storage_path?: string
          validation?: Json
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_images_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_images_page_fk"
            columns: ["org_id", "detail_page_id"]
            isOneToOne: false
            referencedRelation: "detail_pages"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      market_listings: {
        Row: {
          attempts: number
          attribute_overrides: Json
          batch_id: string | null
          created_at: string
          created_by: string | null
          detail_page_id: string | null
          error_code: string | null
          error_message: string | null
          id: string
          job_id: string | null
          market: string
          market_account_id: string
          market_product_id: string | null
          market_url: string | null
          missing_attributes: string[]
          org_id: string
          product_id: string
          registered_at: string | null
          request_snapshot: Json
          response_summary: Json
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          attribute_overrides?: Json
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          detail_page_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          market: string
          market_account_id: string
          market_product_id?: string | null
          market_url?: string | null
          missing_attributes?: string[]
          org_id: string
          product_id: string
          registered_at?: string | null
          request_snapshot?: Json
          response_summary?: Json
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          attribute_overrides?: Json
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          detail_page_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          job_id?: string | null
          market?: string
          market_account_id?: string
          market_product_id?: string | null
          market_url?: string | null
          missing_attributes?: string[]
          org_id?: string
          product_id?: string
          registered_at?: string | null
          request_snapshot?: Json
          response_summary?: Json
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_account_fk"
            columns: ["org_id", "market_account_id"]
            isOneToOne: false
            referencedRelation: "market_accounts"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "market_listings_batch_fk"
            columns: ["org_id", "batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "market_listings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_page_fk"
            columns: ["org_id", "detail_page_id"]
            isOneToOne: false
            referencedRelation: "detail_pages"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "market_listings_product_fk"
            columns: ["org_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          channel: string
          enabled: boolean
          event: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          enabled?: boolean
          event: string
          org_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          channel?: string
          enabled?: boolean
          event?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_prefs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          app_id: string
          code_verifier: string | null
          consumed_at: string | null
          created_at: string
          expires_at: string
          org_id: string
          provider: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          app_id: string
          code_verifier?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          org_id: string
          provider: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          app_id?: string
          code_verifier?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          org_id?: string
          provider?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_states_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          invited_by: string | null
          joined_at: string | null
          org_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_personal: boolean
          name: string
          owner_id: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_personal?: boolean
          name: string
          owner_id: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_personal?: boolean
          name?: string
          owner_id?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount_krw: number
          app_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          credit_pack_id: string | null
          credits: number | null
          currency: string
          customer_key: string | null
          expires_at: string
          id: string
          kind: string
          metadata: Json
          order_id: string
          org_id: string
          plan_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_krw: number
          app_id: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_pack_id?: string | null
          credits?: number | null
          currency?: string
          customer_key?: string | null
          expires_at?: string
          id?: string
          kind: string
          metadata?: Json
          order_id: string
          org_id: string
          plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_krw?: number
          app_id?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_pack_id?: string | null
          credits?: number | null
          currency?: string
          customer_key?: string | null
          expires_at?: string
          id?: string
          kind?: string
          metadata?: Json
          order_id?: string
          org_id?: string
          plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_credit_pack_id_fkey"
            columns: ["credit_pack_id"]
            isOneToOne: false
            referencedRelation: "credit_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_krw: number
          approved_at: string | null
          canceled_amount_krw: number
          created_at: string
          id: string
          method: string | null
          order_id: string
          org_id: string
          payment_key: string
          raw: Json
          receipt_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_krw: number
          approved_at?: string | null
          canceled_amount_krw?: number
          created_at?: string
          id?: string
          method?: string | null
          order_id: string
          org_id: string
          payment_key: string
          raw?: Json
          receipt_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_krw?: number
          approved_at?: string | null
          canceled_amount_krw?: number
          created_at?: string
          id?: string
          method?: string | null
          order_id?: string
          org_id?: string
          payment_key?: string
          raw?: Json
          receipt_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          app_id: string
          billing_interval: string
          carry_over: boolean
          code: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_default: boolean
          monthly_credits: number
          name: string
          price_krw: number
          signup_credits: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          app_id: string
          billing_interval?: string
          carry_over?: boolean
          code: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          monthly_credits?: number
          name: string
          price_krw?: number
          signup_credits?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          app_id?: string
          billing_interval?: string
          carry_over?: boolean
          code?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          monthly_credits?: number
          name?: string
          price_krw?: number
          signup_credits?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      product_activities: {
        Row: {
          created_at: string
          created_by: string | null
          detail: Json
          id: number
          kind: string
          message: string
          org_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detail?: Json
          id?: never
          kind: string
          message: string
          org_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detail?: Json
          id?: never
          kind?: string
          message?: string
          org_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_activities_product_fk"
            columns: ["org_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      product_images: {
        Row: {
          attempt: number
          bg_prompt: string | null
          bytes: number | null
          created_at: string
          created_by: string | null
          error_message: string | null
          height: number | null
          id: string
          is_primary: boolean
          job_id: string | null
          kind: string
          model: string | null
          org_id: string
          overlay_text: string | null
          parent_image_id: string | null
          position: number
          product_id: string
          product_ratio_pct: number | null
          provider: string | null
          source_url: string | null
          status: string
          storage_path: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          attempt?: number
          bg_prompt?: string | null
          bytes?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          height?: number | null
          id?: string
          is_primary?: boolean
          job_id?: string | null
          kind: string
          model?: string | null
          org_id: string
          overlay_text?: string | null
          parent_image_id?: string | null
          position?: number
          product_id: string
          product_ratio_pct?: number | null
          provider?: string | null
          source_url?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          attempt?: number
          bg_prompt?: string | null
          bytes?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          height?: number | null
          id?: string
          is_primary?: boolean
          job_id?: string | null
          kind?: string
          model?: string | null
          org_id?: string
          overlay_text?: string | null
          parent_image_id?: string | null
          position?: number
          product_id?: string
          product_ratio_pct?: number | null
          provider?: string | null
          source_url?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_parent_fk"
            columns: ["org_id", "parent_image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "product_images_product_fk"
            columns: ["org_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json
          banned_replaced_count: number
          brand: string | null
          category_path: string | null
          cost_krw: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expected_margin_pct: number | null
          extra_cost_krw: number
          fx_rate_date: string | null
          fx_rate_krw: number | null
          id: string
          images_confirmed_at: string | null
          images_source: Json
          import_id: string | null
          is_overseas: boolean | null
          job_id: string | null
          marketplace: string | null
          memo: string | null
          org_id: string
          product_kind: string
          sell_price_krw: number | null
          source: string
          source_currency: string | null
          source_price: number | null
          source_ref: string | null
          source_url: string | null
          status: string
          suggested_margin_pct: number | null
          tags: string[]
          title_ai: string | null
          title_char_count: number | null
          title_checked_at: string | null
          title_error: string | null
          title_issues: Json
          title_original: string
          title_verdict: string | null
          title_warn_ack_at: string | null
          title_warn_ack_by: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json
          banned_replaced_count?: number
          brand?: string | null
          category_path?: string | null
          cost_krw?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_margin_pct?: never
          extra_cost_krw?: number
          fx_rate_date?: string | null
          fx_rate_krw?: number | null
          id?: string
          images_confirmed_at?: string | null
          images_source?: Json
          import_id?: string | null
          is_overseas?: never
          job_id?: string | null
          marketplace?: string | null
          memo?: string | null
          org_id: string
          product_kind?: string
          sell_price_krw?: number | null
          source: string
          source_currency?: string | null
          source_price?: number | null
          source_ref?: string | null
          source_url?: string | null
          status?: string
          suggested_margin_pct?: number | null
          tags?: string[]
          title_ai?: string | null
          title_char_count?: never
          title_checked_at?: string | null
          title_error?: string | null
          title_issues?: Json
          title_original: string
          title_verdict?: string | null
          title_warn_ack_at?: string | null
          title_warn_ack_by?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json
          banned_replaced_count?: number
          brand?: string | null
          category_path?: string | null
          cost_krw?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_margin_pct?: never
          extra_cost_krw?: number
          fx_rate_date?: string | null
          fx_rate_krw?: number | null
          id?: string
          images_confirmed_at?: string | null
          images_source?: Json
          import_id?: string | null
          is_overseas?: never
          job_id?: string | null
          marketplace?: string | null
          memo?: string | null
          org_id?: string
          product_kind?: string
          sell_price_krw?: number | null
          source?: string
          source_currency?: string | null
          source_price?: number | null
          source_ref?: string | null
          source_url?: string | null
          status?: string
          suggested_margin_pct?: number | null
          tags?: string[]
          title_ai?: string | null
          title_char_count?: never
          title_checked_at?: string | null
          title_error?: string | null
          title_issues?: Json
          title_original?: string
          title_verdict?: string | null
          title_warn_ack_at?: string | null
          title_warn_ack_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_import_fk"
            columns: ["org_id", "import_id"]
            isOneToOne: false
            referencedRelation: "source_imports"
            referencedColumns: ["org_id", "id"]
          },
          {
            foreignKeyName: "products_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          last_seen_at: string | null
          locale: string
          platform_role: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          last_seen_at?: string | null
          locale?: string
          platform_role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          last_seen_at?: string | null
          locale?: string
          platform_role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          org_id: string
          screen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          org_id: string
          screen: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          org_id?: string
          screen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      season_picks: {
        Row: {
          base_ratio: number | null
          category: string | null
          created_at: string
          current_ratio: number | null
          growth_pct: number
          id: number
          keyword: string
          pick_date: string
          rank: number
        }
        Insert: {
          base_ratio?: number | null
          category?: string | null
          created_at?: string
          current_ratio?: number | null
          growth_pct: number
          id?: never
          keyword: string
          pick_date: string
          rank: number
        }
        Update: {
          base_ratio?: number | null
          category?: string | null
          created_at?: string
          current_ratio?: number | null
          growth_pct?: number
          id?: never
          keyword?: string
          pick_date?: string
          rank?: number
        }
        Relationships: []
      }
      shipping_templates: {
        Row: {
          auto_attach_overseas: boolean
          contact_phone: string | null
          created_at: string
          created_by: string | null
          delivery_days_max: number | null
          delivery_days_min: number | null
          dispatch_days: number
          exchange_allowed: boolean
          id: string
          initial_shipping_fee_krw: number | null
          is_default: boolean
          name: string
          notice_text: string
          org_id: string
          requires_customs_code: boolean
          restriction_codes: string[]
          return_address: Json
          return_fee_krw: number | null
          return_window_days: number
          template_type: string
          updated_at: string
        }
        Insert: {
          auto_attach_overseas?: boolean
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          delivery_days_max?: number | null
          delivery_days_min?: number | null
          dispatch_days?: number
          exchange_allowed?: boolean
          id?: string
          initial_shipping_fee_krw?: number | null
          is_default?: boolean
          name: string
          notice_text?: string
          org_id: string
          requires_customs_code?: boolean
          restriction_codes?: string[]
          return_address?: Json
          return_fee_krw?: number | null
          return_window_days?: number
          template_type?: string
          updated_at?: string
        }
        Update: {
          auto_attach_overseas?: boolean
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          delivery_days_max?: number | null
          delivery_days_min?: number | null
          dispatch_days?: number
          exchange_allowed?: boolean
          id?: string
          initial_shipping_fee_krw?: number | null
          is_default?: boolean
          name?: string
          notice_text?: string
          org_id?: string
          requires_customs_code?: boolean
          restriction_codes?: string[]
          return_address?: Json
          return_fee_krw?: number | null
          return_window_days?: number
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_addons: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          payment_order_id: string | null
          period_end: string | null
          period_start: string | null
          quantity: number
          status: string
          unit_price_krw: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          payment_order_id?: string | null
          period_end?: string | null
          period_start?: string | null
          quantity: number
          status?: string
          unit_price_krw?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          payment_order_id?: string | null
          period_end?: string | null
          period_start?: string | null
          quantity?: number
          status?: string
          unit_price_krw?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_addons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_addons_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      source_imports: {
        Row: {
          collected_rows: number
          column_mapping: Json
          created_at: string
          created_by: string | null
          error_message: string | null
          error_rows: number
          excluded_rows: number
          file_path: string | null
          finished_at: string | null
          fx_rate_id: number | null
          id: string
          input_kind: string
          job_id: string | null
          marketplace: string | null
          mode: string
          org_id: string
          source: string
          status: string
          target_margin_pct: number | null
          total_rows: number
          updated_at: string
          workflow_run_id: string | null
        }
        Insert: {
          collected_rows?: number
          column_mapping?: Json
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          error_rows?: number
          excluded_rows?: number
          file_path?: string | null
          finished_at?: string | null
          fx_rate_id?: number | null
          id?: string
          input_kind: string
          job_id?: string | null
          marketplace?: string | null
          mode?: string
          org_id: string
          source: string
          status?: string
          target_margin_pct?: number | null
          total_rows?: number
          updated_at?: string
          workflow_run_id?: string | null
        }
        Update: {
          collected_rows?: number
          column_mapping?: Json
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          error_rows?: number
          excluded_rows?: number
          file_path?: string | null
          finished_at?: string | null
          fx_rate_id?: number | null
          id?: string
          input_kind?: string
          job_id?: string | null
          marketplace?: string | null
          mode?: string
          org_id?: string
          source?: string
          status?: string
          target_margin_pct?: number | null
          total_rows?: number
          updated_at?: string
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_imports_fx_rate_id_fkey"
            columns: ["fx_rate_id"]
            isOneToOne: false
            referencedRelation: "fx_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_imports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_imports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_imports_run_fk"
            columns: ["org_id", "workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          app_id: string
          billing_key_id: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          failed_charge_count: number
          id: string
          last_credit_grant_key: string | null
          next_charge_at: string | null
          org_id: string
          plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          app_id: string
          billing_key_id?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          failed_charge_count?: number
          id?: string
          last_credit_grant_key?: string | null
          next_charge_at?: string | null
          org_id: string
          plan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          billing_key_id?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          failed_charge_count?: number
          id?: string
          last_credit_grant_key?: string | null
          next_charge_at?: string | null
          org_id?: string
          plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      title_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          credit_ledger_id: number | null
          id: number
          model: string | null
          org_id: string
          origin: string
          product_id: string
          replacements: Json
          revision_no: number
          title: string
          verdict: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          id?: never
          model?: string | null
          org_id: string
          origin: string
          product_id: string
          replacements?: Json
          revision_no: number
          title: string
          verdict?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          id?: never
          model?: string | null
          org_id?: string
          origin?: string
          product_id?: string
          replacements?: Json
          revision_no?: number
          title?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "title_revisions_credit_ledger_id_fkey"
            columns: ["credit_ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_revisions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_revisions_product_fk"
            columns: ["org_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      trend_keywords: {
        Row: {
          category: string | null
          fetched_at: string
          id: number
          keyword: string
          period_end: string
          period_start: string
          points: Json
          source: string
          time_unit: string
        }
        Insert: {
          category?: string | null
          fetched_at?: string
          id?: never
          keyword: string
          period_end: string
          period_start: string
          points?: Json
          source?: string
          time_unit?: string
        }
        Update: {
          category?: string | null
          fetched_at?: string
          id?: never
          keyword?: string
          period_end?: string
          period_start?: string
          points?: Json
          source?: string
          time_unit?: string
        }
        Relationships: []
      }
      upload_batches: {
        Row: {
          account_ids: string[]
          created_at: string
          created_by: string | null
          done_count: number | null
          failed_count: number
          finished_at: string | null
          id: string
          idempotency_key: string | null
          org_id: string
          product_ids: string[]
          registered_count: number
          sending_count: number
          skipped_count: number
          started_at: string | null
          status: string
          total_count: number
          updated_at: string
          waiting_count: number
          workflow_run_id: string | null
        }
        Insert: {
          account_ids: string[]
          created_at?: string
          created_by?: string | null
          done_count?: never
          failed_count?: number
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          org_id: string
          product_ids: string[]
          registered_count?: number
          sending_count?: number
          skipped_count?: number
          started_at?: string | null
          status?: string
          total_count?: number
          updated_at?: string
          waiting_count?: number
          workflow_run_id?: string | null
        }
        Update: {
          account_ids?: string[]
          created_at?: string
          created_by?: string | null
          done_count?: never
          failed_count?: number
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          org_id?: string
          product_ids?: string[]
          registered_count?: number
          sending_count?: number
          skipped_count?: number
          started_at?: string | null
          status?: string
          total_count?: number
          updated_at?: string
          waiting_count?: number
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_batches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upload_batches_run_fk"
            columns: ["org_id", "workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      wallets: {
        Row: {
          org_id: string
          pack_balance: number
          plan_balance: number
          updated_at: string
        }
        Insert: {
          org_id: string
          pack_balance?: number
          plan_balance?: number
          updated_at?: string
        }
        Update: {
          org_id?: string
          pack_balance?: number
          plan_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempts: number
          error: string | null
          event_id: string
          event_type: string | null
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
          signature_valid: boolean
          status: string
        }
        Insert: {
          attempts?: number
          error?: string | null
          event_id: string
          event_type?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string
          signature_valid?: boolean
          status?: string
        }
        Update: {
          attempts?: number
          error?: string | null
          event_id?: string
          event_type?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
          signature_valid?: boolean
          status?: string
        }
        Relationships: []
      }
      workflow_run_steps: {
        Row: {
          attempts: number
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_id: string | null
          label: string
          log_path: string | null
          log_tail: string | null
          max_attempts: number
          node_key: string
          node_type: string
          org_id: string
          output: Json
          position: number
          run_id: string
          started_at: string | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          duration_ms?: never
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_id?: string | null
          label: string
          log_path?: string | null
          log_tail?: string | null
          max_attempts?: number
          node_key: string
          node_type: string
          org_id: string
          output?: Json
          position: number
          run_id: string
          started_at?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          duration_ms?: never
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_id?: string | null
          label?: string
          log_path?: string | null
          log_tail?: string | null
          max_attempts?: number
          node_key?: string
          node_type?: string
          org_id?: string
          output?: Json
          position?: number
          run_id?: string
          started_at?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_run_steps_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_run_steps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_run_steps_run_fk"
            columns: ["org_id", "run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          cancel_requested_at: string | null
          created_at: string
          created_by: string | null
          credit_ledger_id: number | null
          current_step_label: string | null
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          kind: string
          name: string
          org_id: string
          parent_run_id: string | null
          pipeline: string | null
          progress_summary: Json
          resume_from_step: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          steps_done: number
          steps_total: number
          subject: Json
          trigger_source: string
          updated_at: string
          workflow_id: string | null
          workflow_version_id: string | null
        }
        Insert: {
          cancel_requested_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          current_step_label?: string | null
          duration_ms?: never
          error_message?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          name: string
          org_id: string
          parent_run_id?: string | null
          pipeline?: string | null
          progress_summary?: Json
          resume_from_step?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          steps_done?: number
          steps_total?: number
          subject?: Json
          trigger_source?: string
          updated_at?: string
          workflow_id?: string | null
          workflow_version_id?: string | null
        }
        Update: {
          cancel_requested_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_ledger_id?: number | null
          current_step_label?: string | null
          duration_ms?: never
          error_message?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          name?: string
          org_id?: string
          parent_run_id?: string | null
          pipeline?: string | null
          progress_summary?: Json
          resume_from_step?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          steps_done?: number
          steps_total?: number
          subject?: Json
          trigger_source?: string
          updated_at?: string
          workflow_id?: string | null
          workflow_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_credit_ledger_id_fkey"
            columns: ["credit_ledger_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_parent_fk"
            columns: ["org_id", "parent_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["org_id", "id"]
          },
        ]
      }
    }
    Views: {
      billing_key_summaries: {
        Row: {
          card_company: string | null
          card_number_masked: string | null
          created_at: string | null
          customer_key: string | null
          id: string | null
          org_id: string | null
          revoked_at: string | null
          status: string | null
        }
        Insert: {
          card_company?: string | null
          card_number_masked?: string | null
          created_at?: string | null
          customer_key?: string | null
          id?: string | null
          org_id?: string | null
          revoked_at?: string | null
          status?: string | null
        }
        Update: {
          card_company?: string | null
          card_number_masked?: string | null
          created_at?: string | null
          customer_key?: string | null
          id?: string | null
          org_id?: string | null
          revoked_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      credential_summaries: {
        Row: {
          app_id: string | null
          created_at: string | null
          expires_at: string | null
          external_account_id: string | null
          id: string | null
          label: string | null
          last_refreshed_at: string | null
          org_id: string | null
          provider: string | null
          scopes: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string | null
          label?: string | null
          last_refreshed_at?: string | null
          org_id?: string | null
          provider?: string | null
          scopes?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string | null
          label?: string | null
          last_refreshed_at?: string | null
          org_id?: string | null
          provider?: string | null
          scopes?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_balances: {
        Row: {
          balance: number | null
          org_id: string | null
          pack_balance: number | null
          plan_balance: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          org_id?: string | null
          pack_balance?: number | null
          plan_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          org_id?: string | null
          pack_balance?: number | null
          plan_balance?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_ledger_reconciliation: {
        Row: {
          drift: number | null
          ledger_balance: number | null
          org_id: string | null
          wallet_balance: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invite: {
        Args: {
          p_org_id: string
        }
        Returns: Database["public"]["Tables"]["org_members"]["Row"]
      }
      apply_subscription_transition: {
        Args: {
          p_subscription_id: string
          p_to: string
          p_reason?: string
        }
        Returns: Database["public"]["Tables"]["subscriptions"]["Row"]
      }
      approve_member: {
        Args: {
          p_org_id: string
          p_user_id: string
        }
        Returns: Database["public"]["Tables"]["org_members"]["Row"]
      }
      approve_profile: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
      bootstrap_app_for_org: {
        Args: {
          p_app_id: string
          p_org_id?: string
        }
        Returns: undefined
      }
      cancel_job: {
        Args: {
          p_job_id: string
        }
        Returns: Database["public"]["Tables"]["jobs"]["Row"]
      }
      change_member_role: {
        Args: {
          p_org_id: string
          p_user_id: string
          p_role: string
        }
        Returns: Database["public"]["Tables"]["org_members"]["Row"]
      }
      claim_jobs: {
        Args: {
          p_queue: string
          p_worker_id: string
          p_limit?: number
          p_job_types?: string[]
        }
        Returns: Database["public"]["Tables"]["jobs"]["Row"][]
      }
      complete_job: {
        Args: {
          p_job_id: string
          p_worker_id: string
          p_result?: Json
        }
        Returns: Database["public"]["Tables"]["jobs"]["Row"]
      }
      confirm_payment_order: {
        Args: {
          p_order_id: string
          p_payment_key: string
          p_amount_krw: number
          p_method?: string
          p_raw?: Json
          p_approved_at?: string
        }
        Returns: Database["public"]["Tables"]["payments"]["Row"]
      }
      consume_credits: {
        Args: {
          p_org_id: string
          p_amount: number
          p_app_id: string
          p_reason: string
          p_ref_type?: string
          p_ref_id?: string
          p_idempotency_key?: string
          p_metadata?: Json
          p_actor_id?: string
        }
        Returns: {
          ledger_id: number
          new_balance: number
          plan_used: number
          pack_used: number
        }[]
      }
      consume_oauth_state: {
        Args: {
          p_state: string
        }
        Returns: Database["public"]["Tables"]["oauth_states"]["Row"]
      }
      create_oauth_state: {
        Args: {
          p_user_id: string
          p_org_id: string
          p_app_id: string
          p_provider: string
          p_redirect_to?: string
          p_code_verifier?: string
          p_ttl_seconds?: number
        }
        Returns: string
      }
      current_org_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      current_org_role: {
        Args: {
          org: string
        }
        Returns: string
      }
      enqueue_job: {
        Args: {
          p_org_id: string
          p_app_id: string
          p_queue: string
          p_job_type: string
          p_payload?: Json
          p_priority?: number
          p_run_after?: string
          p_max_attempts?: number
          p_credit_ledger_id?: number
          p_idempotency_key?: string
          p_parent_job_id?: string
          p_created_by?: string
          p_refund_on_failure?: boolean
        }
        Returns: Database["public"]["Tables"]["jobs"]["Row"]
      }
      entitled_plan_code: {
        Args: {
          org: string
          app: string
        }
        Returns: string
      }
      expire_stale_payment_orders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      fail_job: {
        Args: {
          p_job_id: string
          p_worker_id: string
          p_error: string
          p_retryable?: boolean
          p_retry_delay_seconds?: number
        }
        Returns: Database["public"]["Tables"]["jobs"]["Row"]
      }
      fail_payment_order: {
        Args: {
          p_order_id: string
          p_reason: string
          p_detail?: Json
        }
        Returns: Database["public"]["Tables"]["payment_orders"]["Row"]
      }
      gc_acknowledge_compliance_warning: {
        Args: {
          p_target_type: string
          p_target_id: string
          p_note?: string
        }
        Returns: undefined
      }
      gc_admin_set_plan: {
        Args: {
          p_org_id: string
          p_plan_code: string
          p_reason: string
        }
        Returns: undefined
      }
      gc_apply_product_edits: {
        Args: {
          p_org_id: string
          p_actor_id: string
          p_edits: Json
        }
        Returns: Database["public"]["Tables"]["products"]["Row"][]
      }
      gc_assert_compliance: {
        Args: {
          p_org_id: string
          p_product_id: string
          p_detail_page_id: string
          p_min_page: string
        }
        Returns: undefined
      }
      gc_create_upload_batch: {
        Args: {
          p_org_id: string
          p_actor_id: string
          p_product_ids: string[]
          p_account_ids: string[]
          p_request_id: string
        }
        Returns: Json
      }
      gc_dashboard_summary: {
        Args: {
          p_org_id: string
        }
        Returns: Json
      }
      gc_features: {
        Args: {
          p_org_id: string
        }
        Returns: Json
      }
      gc_flag: {
        Args: {
          p_org_id: string
          p_key: string
        }
        Returns: boolean
      }
      gc_limit: {
        Args: {
          p_org_id: string
          p_key: string
          p_default: number
        }
        Returns: number
      }
      gc_market_slot_limit: {
        Args: {
          p_org_id: string
        }
        Returns: number
      }
      gc_record_step_outcome: {
        Args: {
          p_step_id: string
          p_outcome: string
          p_message?: string
        }
        Returns: Database["public"]["Tables"]["workflow_run_steps"]["Row"]
      }
      gc_release_held_jobs: {
        Args: {
          p_max?: number
        }
        Returns: number
      }
      gc_transition_allowed: {
        Args: {
          p_table: string
          p_from: string
          p_to: string
        }
        Returns: boolean
      }
      grant_credits: {
        Args: {
          p_org_id: string
          p_amount: number
          p_app_id: string
          p_reason: string
          p_bucket?: string
          p_ref_type?: string
          p_ref_id?: string
          p_idempotency_key?: string
          p_metadata?: Json
          p_actor_id?: string
          p_reset_plan_bucket?: boolean
        }
        Returns: {
          ledger_id: number
          new_balance: number
        }[]
      }
      has_entitlement: {
        Args: {
          org: string
          app: string
        }
        Returns: boolean
      }
      has_org_role: {
        Args: {
          org: string
          roles: string[]
        }
        Returns: boolean
      }
      heartbeat_job: {
        Args: {
          p_job_id: string
          p_worker_id: string
          p_progress?: number
          p_message?: string
        }
        Returns: boolean
      }
      invite_member: {
        Args: {
          p_org_id: string
          p_user_id: string
          p_role?: string
        }
        Returns: Database["public"]["Tables"]["org_members"]["Row"]
      }
      is_org_member: {
        Args: {
          org: string
        }
        Returns: boolean
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_privileged_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_caller: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      jwt_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      on_signup_app_bootstrap: {
        Args: {
          p_org_id: string
          p_user_id: string
          p_app_id: string
        }
        Returns: undefined
      }
      personal_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      purge_expired_oauth_states: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      purge_organization: {
        Args: {
          p_org_id: string
        }
        Returns: undefined
      }
      purge_rate_limit_buckets: {
        Args: {
          p_older_than?: string
        }
        Returns: number
      }
      rate_limit_hit: {
        Args: {
          p_key: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      reap_stale_jobs: {
        Args: {
          p_stale_seconds?: number
        }
        Returns: number
      }
      refund_credits: {
        Args: {
          p_consume_ledger_id: number
          p_reason: string
          p_amount?: number
          p_idempotency_key?: string
          p_actor_id?: string
        }
        Returns: {
          ledger_id: number
          new_balance: number
        }[]
      }
      remove_member: {
        Args: {
          p_org_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      revoke_credential: {
        Args: {
          p_credential_id: string
        }
        Returns: undefined
      }
      run_monthly_credit_grants: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      run_subscription_rollover: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      session_context: {
        Args: {
          p_app?: string
          p_org?: string
        }
        Returns: Json
      }
      storage_org_id: {
        Args: {
          p_name: string
        }
        Returns: string
      }
      transfer_ownership: {
        Args: {
          p_org_id: string
          p_new_owner: string
        }
        Returns: undefined
      }
      write_audit: {
        Args: {
          p_org_id: string
          p_action: string
          p_target_type?: string
          p_target_id?: string
          p_before?: Json
          p_after?: Json
          p_metadata?: Json
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
