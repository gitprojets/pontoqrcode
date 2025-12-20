import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get counts using service role (bypasses RLS)
    const { count: escolas } = await supabase
      .from('unidades')
      .select('*', { count: 'exact', head: true })

    const { count: usuarios } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const today = new Date().toISOString().split('T')[0]
    const { count: leituras } = await supabase
      .from('registros_frequencia')
      .select('*', { count: 'exact', head: true })
      .eq('data_registro', today)

    return new Response(
      JSON.stringify({
        escolas: escolas || 0,
        usuarios: usuarios || 0,
        leituras: leituras || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error fetching stats:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stats' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})