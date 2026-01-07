import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RotationRequest {
  days_before_expiry?: number; // Days before expiry to trigger rotation notification
  force_rotation?: boolean; // Force immediate rotation
  dispositivo_id?: string; // Specific device to rotate
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: RotationRequest = await req.json().catch(() => ({}));
    const { days_before_expiry = 7, force_rotation = false, dispositivo_id } = requestData;

    console.log('API Key Rotation check started', { days_before_expiry, force_rotation, dispositivo_id });

    // Get devices pending rotation
    const { data: devices, error: fetchError } = await supabase
      .from('dispositivo_api_keys')
      .select(`
        dispositivo_id,
        next_rotation_at,
        rotation_notification_sent,
        rotation_interval_days,
        dispositivos!inner (
          id,
          nome,
          unidade_id
        )
      `)
      .not('next_rotation_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching devices:', fetchError);
      throw fetchError;
    }

    const results = {
      rotated: [] as string[],
      notified: [] as string[],
      errors: [] as { device: string; error: string }[],
    };

    for (const device of devices || []) {
      const deviceId = device.dispositivo_id;
      const deviceName = (device.dispositivos as any)?.nome || 'Unknown';
      const nextRotation = new Date(device.next_rotation_at);
      const now = new Date();
      const daysUntilRotation = Math.ceil((nextRotation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Skip if not the target device (when specific device requested)
      if (dispositivo_id && deviceId !== dispositivo_id) continue;

      try {
        // Force rotation or expired
        if (force_rotation || daysUntilRotation <= 0) {
          console.log(`Rotating API key for device: ${deviceName}`);
          
          // Generate new key
          const newKey = crypto.randomUUID();
          
          // Update encrypted key directly (bypass RPC for service role)
          const { error: updateError } = await supabase
            .from('dispositivo_api_keys')
            .update({
              encrypted_key: newKey, // Service role will handle encryption
              key_hint: newKey.substring(0, 8) + '...',
              rotated_at: new Date().toISOString(),
              next_rotation_at: new Date(Date.now() + (device.rotation_interval_days || 90) * 24 * 60 * 60 * 1000).toISOString(),
              rotation_notification_sent: false,
            })
            .eq('dispositivo_id', deviceId);

          if (updateError) throw updateError;

          results.rotated.push(deviceName);

          // Send notification about rotation
          await sendRotationEmail(supabase, deviceId, deviceName, 'rotated', newKey);
        }
        // Send notification if approaching expiry
        else if (daysUntilRotation <= days_before_expiry && !device.rotation_notification_sent) {
          console.log(`Sending rotation warning for device: ${deviceName}`);
          
          // Mark notification as sent
          await supabase
            .from('dispositivo_api_keys')
            .update({ rotation_notification_sent: true })
            .eq('dispositivo_id', deviceId);

          // Send email notification
          await sendRotationEmail(supabase, deviceId, deviceName, 'warning', null, daysUntilRotation);

          results.notified.push(deviceName);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing device ${deviceName}:`, errorMsg);
        results.errors.push({ device: deviceName, error: errorMsg });
      }
    }

    console.log('API Key Rotation check completed', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Rotation check completed',
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error in rotate-api-keys:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

async function sendRotationEmail(
  supabase: any,
  deviceId: string,
  deviceName: string,
  type: 'warning' | 'rotated',
  newKey: string | null,
  daysUntilRotation?: number
) {
  try {
    // Get developers to notify
    const { data: developers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'desenvolvedor');

    if (!developers?.length) {
      console.log('No developers found to notify');
      return;
    }

    const developerIds = developers.map((d: any) => d.user_id);

    // Get developer emails
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, nome')
      .in('id', developerIds);

    if (!profiles?.length) {
      console.log('No developer profiles found');
      return;
    }

    // Send email to each developer
    for (const profile of profiles) {
      const subject = type === 'warning'
        ? `⚠️ API Key do dispositivo "${deviceName}" expira em ${daysUntilRotation} dias`
        : `🔄 API Key do dispositivo "${deviceName}" foi rotacionada`;

      const content = type === 'warning'
        ? `A API Key do dispositivo "${deviceName}" irá expirar em ${daysUntilRotation} dias. 
           
           Por favor, acesse o sistema para rotacionar a chave manualmente ou aguarde a rotação automática.`
        : `A API Key do dispositivo "${deviceName}" foi rotacionada com sucesso.
           
           ${newKey ? `Nova chave: ${newKey}\n\nIMPORTANTE: Atualize a configuração do dispositivo com a nova chave.` : 'A nova chave está disponível no sistema.'}`;

      // Call send-notification-email function
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          tipo: 'geral',
          destinatario_email: profile.email,
          destinatario_nome: profile.nome,
          assunto: subject,
          conteudo: content,
          dados_extras: { dispositivo: deviceName, tipo: 'api_key_rotation' },
        },
      });

      if (error) {
        console.error(`Failed to send email to ${profile.email}:`, error);
      } else {
        console.log(`Rotation notification sent to ${profile.email}`);
      }
    }
  } catch (error) {
    console.error('Error sending rotation email:', error);
  }
}
