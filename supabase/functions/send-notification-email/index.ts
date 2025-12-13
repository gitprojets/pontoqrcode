import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  tipo: 'ausencia' | 'atraso' | 'lembrete' | 'ticket_resposta' | 'geral';
  destinatario_id?: string;
  destinatario_email?: string;
  destinatario_nome?: string;
  assunto: string;
  conteudo: string;
  dados_extras?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: NotificationRequest = await req.json();
    const { tipo, destinatario_id, destinatario_email, destinatario_nome, assunto, conteudo, dados_extras } = requestData;

    console.log(`Processing ${tipo} notification for ${destinatario_email || destinatario_id}`);

    // Get recipient email if only ID provided
    let email = destinatario_email;
    let nome = destinatario_nome || 'Usuário';

    if (destinatario_id && !email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nome')
        .eq('id', destinatario_id)
        .single();
      
      if (profile) {
        email = profile.email;
        nome = profile.nome;
      }
    }

    if (!email) {
      throw new Error("Email do destinatário não encontrado");
    }

    // Generate HTML email based on type
    const emailHtml = generateEmailHtml(tipo, nome, assunto, conteudo, dados_extras);

    // Log the notification in database
    const { error: logError } = await supabase
      .from('email_notifications')
      .insert({
        user_id: destinatario_id,
        tipo,
        assunto,
        conteudo,
        status: 'pendente',
      });

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    // For now, we log the email details (in production, integrate with Resend or similar)
    console.log('Email notification prepared:', {
      to: email,
      subject: assunto,
      tipo,
    });

    // Note: To send actual emails, configure RESEND_API_KEY and uncomment:
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { error: sendError } = await resend.emails.send({
      from: "FrequênciaQR <noreply@frequenciaqr.com>",
      to: [email],
      subject: assunto,
      html: emailHtml,
    });

    if (sendError) throw sendError;
    */

    // Update notification status
    if (destinatario_id) {
      await supabase
        .from('email_notifications')
        .update({ 
          status: 'enviado',
          sent_at: new Date().toISOString()
        })
        .eq('user_id', destinatario_id)
        .eq('assunto', assunto)
        .eq('status', 'pendente');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notificação processada com sucesso",
        email_prepared: {
          to: email,
          subject: assunto,
          type: tipo
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-notification-email:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailHtml(
  tipo: string, 
  nome: string, 
  assunto: string, 
  conteudo: string,
  dadosExtras?: Record<string, unknown>
): string {
  const headerColor = tipo === 'ausencia' ? '#ef4444' : 
                      tipo === 'atraso' ? '#f59e0b' : 
                      tipo === 'ticket_resposta' ? '#3b82f6' : '#10b981';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${assunto}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                FrequênciaQR
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Sistema de Controle de Frequência
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                ${assunto}
              </h2>
              
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                Olá, <strong>${nome}</strong>!
              </p>
              
              <div style="margin: 24px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid ${headerColor};">
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7;">
                  ${conteudo.replace(/\n/g, '<br>')}
                </p>
              </div>
              
              ${dadosExtras?.data ? `
              <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">
                <strong>Data:</strong> ${dadosExtras.data}
              </p>
              ` : ''}
              
              ${dadosExtras?.hora ? `
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                <strong>Hora:</strong> ${dadosExtras.hora}
              </p>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                Este é um email automático do sistema FrequênciaQR.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2024 FrequênciaQR - Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(handler);
