import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportResult {
  schema: {
    tables: any[];
    functions: any[];
    policies: any[];
    triggers: any[];
  };
  data: Record<string, any[]>;
  storage: {
    buckets: any[];
  };
  auth: {
    config: any;
  };
  secrets: string[];
  exportedAt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with service role for full access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is developer
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: roleData } = await supabaseAdmin.rpc("get_user_role", { _user_id: user.id });
    if (roleData !== "desenvolvedor") {
      throw new Error("Apenas desenvolvedores podem exportar o banco de dados");
    }

    const result: ExportResult = {
      schema: {
        tables: [],
        functions: [],
        policies: [],
        triggers: [],
      },
      data: {},
      storage: {
        buckets: [],
      },
      auth: {
        config: {},
      },
      secrets: [],
      exportedAt: new Date().toISOString(),
    };

    // 1. Export table schemas
    const { data: tables } = await supabaseAdmin
      .from("information_schema.tables" as any)
      .select("table_name, table_type")
      .eq("table_schema", "public");

    // List of tables to export
    const tablesToExport = [
      "profiles",
      "user_roles",
      "unidades",
      "admin_unidades",
      "dispositivos",
      "dispositivo_api_keys",
      "registros_frequencia",
      "escalas_trabalho",
      "justificativas",
      "attendance_rules",
      "school_events",
      "qr_nonces",
      "push_subscriptions",
      "notification_logs",
      "email_notifications",
      "support_tickets",
      "audit_logs",
      "user_settings",
    ];

    // 2. Export data from each table
    for (const tableName of tablesToExport) {
      try {
        const { data: tableData, error } = await supabaseAdmin
          .from(tableName)
          .select("*")
          .limit(10000);

        if (!error && tableData) {
          result.data[tableName] = tableData;
        }
      } catch (e) {
        console.error(`Error exporting table ${tableName}:`, e);
        result.data[tableName] = [];
      }
    }

    // 3. Export storage buckets info
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    result.storage.buckets = buckets || [];

    // 4. List configured secrets (names only, not values)
    result.secrets = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "QR_JWT_SECRET",
      "RESEND_API_KEY",
      "VAPID_PUBLIC_KEY",
      "VAPID_PRIVATE_KEY",
    ];

    // 5. Auth config note
    result.auth.config = {
      note: "Configure manualmente no novo projeto Supabase",
      settings: {
        autoConfirmEmail: true,
        disableSignup: false,
        externalAnonymousUsersEnabled: false,
      },
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
