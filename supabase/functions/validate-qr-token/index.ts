import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// Allowed origins for CORS - production domain only
const ALLOWED_ORIGINS = [
  'https://frequenciaqr.lovable.app',
  'https://ygangoaqopfqagyzijrk.supabase.co',
  Deno.env.get('CORS_ALLOWED_ORIGIN') || ''
].filter(Boolean);

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

// Secret key for JWT verification - MUST be configured in environment
const getJwtSecret = () => {
  const secretKey = Deno.env.get('QR_JWT_SECRET');
  if (!secretKey) {
    throw new Error('QR_JWT_SECRET environment variable is required for security');
  }
  return new TextEncoder().encode(secretKey);
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { token } = await req.json();
    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify JWT signature and expiration
    let payload: jose.JWTPayload;
    try {
      const jwtSecret = getJwtSecret();
      const { payload: verifiedPayload } = await jose.jwtVerify(token, jwtSecret);
      payload = verifiedPayload;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Token inválido ou expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const professorId = payload.sub as string;
    const matricula = payload.mat as string;
    const nome = payload.nome as string;
    const unidadeId = payload.uid as string;
    const nonce = payload.nonce as string;

    // Check if nonce exists and hasn't been used
    const { data: nonceRecord, error: nonceError } = await supabaseClient
      .from('qr_nonces')
      .select('*')
      .eq('nonce', nonce)
      .eq('professor_id', professorId)
      .single();

    if (nonceError || !nonceRecord) {
      console.error('Nonce not found:', nonceError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Token não encontrado ou inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if nonce was already used (replay attack prevention)
    if (nonceRecord.used_at) {
      console.warn(`Replay attack detected for nonce: ${nonce}`);
      return new Response(
        JSON.stringify({ valid: false, error: 'Token já utilizado (possível ataque de replay)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if nonce is expired
    if (new Date(nonceRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark nonce as used
    const { error: updateError } = await supabaseClient
      .from('qr_nonces')
      .update({ used_at: new Date().toISOString() })
      .eq('nonce', nonce);

    if (updateError) {
      console.error('Error marking nonce as used:', updateError);
    }

    // Get professor details from database
    const { data: professor, error: professorError } = await supabaseClient
      .from('profiles')
      .select('id, nome, matricula, unidade_id')
      .eq('id', professorId)
      .single();

    if (professorError || !professor) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Professor não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`QR token validated for professor ${professorId}, nonce: ${nonce}`);

    return new Response(
      JSON.stringify({
        valid: true,
        professor: {
          id: professor.id,
          nome: professor.nome,
          matricula: professor.matricula,
          unidade_id: professor.unidade_id,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating QR token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
