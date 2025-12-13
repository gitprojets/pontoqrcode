import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
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

    // Generate HTML email
    const emailHtml = generateEmailHtml(tipo, nome, assunto, conteudo, dados_extras);

    // Log the notification in database
    const { data: notification, error: logError } = await supabase
      .from('email_notifications')
      .insert({
        user_id: destinatario_id,
        tipo,
        assunto,
        conteudo,
        status: 'pendente',
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging notification:', logError);
    }

    // Send email using Resend if API key is configured
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      try {
        const { data: emailResult, error: sendError } = await resend.emails.send({
          from: "FrequênciaQR <onboarding@resend.dev>",
          to: [email],
          subject: assunto,
          html: emailHtml,
        });

        if (sendError) {
          console.error('Error sending email:', sendError);
          
          // Update notification status to error
          if (notification?.id) {
            await supabase
              .from('email_notifications')
              .update({ 
                status: 'erro',
                erro_mensagem: sendError.message
              })
              .eq('id', notification.id);
          }

          throw sendError;
        }

        console.log('Email sent successfully:', emailResult);

        // Update notification status to sent
        if (notification?.id) {
          await supabase
            .from('email_notifications')
            .update({ 
              status: 'enviado',
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email enviado com sucesso",
            email_id: emailResult?.id
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown email error';
        console.error('Failed to send email:', errorMessage);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Falha ao enviar email",
            error: errorMessage
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      console.log('RESEND_API_KEY not configured, email logged but not sent');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notificação registrada (email não configurado)",
          notification_id: notification?.id
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
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
                      tipo === 'ticket_resposta' ? '#10b981' : '#3b82f6';

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
