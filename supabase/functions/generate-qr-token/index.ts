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

// Secret key for JWT signing - MUST be configured in environment
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, matricula, nome, unidade_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // Limpar nonces expirados deste professor (manutenção automática)
    await supabaseClient
      .from('qr_nonces')
      .delete()
      .eq('professor_id', user.id)
      .lt('expires_at', new Date().toISOString());

    // Generate unique nonce
    const nonce = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = new Date(now + 60000); // 60 seconds

    // Store nonce in database for server-side validation
    const { error: nonceError } = await supabaseClient
      .from('qr_nonces')
      .insert({
        nonce,
        professor_id: user.id,
        expires_at: expiresAt.toISOString(),
      });

    if (nonceError) {
      console.error('Error storing nonce:', nonceError);
      throw new Error('Failed to generate secure token');
    }

    // Create JWT payload
    const payload = {
      sub: user.id,
      mat: profile.matricula,
      nome: profile.nome,
      uid: profile.unidade_id,
      nonce,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    // Sign JWT with HS256
    const jwtSecret = getJwtSecret();
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('60s')
      .sign(jwtSecret);

    console.log(`Generated QR token for user ${user.id}, nonce: ${nonce}`);

    return new Response(
      JSON.stringify({ 
        token: jwt,
        expiresAt: expiresAt.toISOString(),
        expiresIn: 60
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating QR token:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
