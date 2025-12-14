import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define role hierarchy - which roles can create which other roles
// Diretores, Coordenadores e Secretários NÃO podem criar usuários
const rolePermissions: Record<string, string[]> = {
  desenvolvedor: ['administrador', 'diretor', 'coordenador', 'professor', 'secretario', 'outro'],
  administrador: ['diretor', 'coordenador', 'professor', 'secretario', 'outro'],
  diretor: [], // Diretor não pode criar usuários
  coordenador: [],
  professor: [],
  secretario: [],
  outro: [],
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user's auth token to check permissions
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Admin client for creating users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !currentUser) {
      console.error('Failed to get current user:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current user ID:', currentUser.id);

    // Get current user's role using the has_role function
    const { data: currentUserRole, error: roleError } = await supabaseAdmin
      .rpc('get_user_role', { _user_id: currentUser.id });

    if (roleError || !currentUserRole) {
      console.error('Failed to get user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Não foi possível verificar permissões' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current user role:', currentUserRole);

    // Parse request body
    const { email, password, nome, role, unidade_id, matricula, admin_unidades } = await req.json();

    // Validate required fields
    if (!email || !password || !nome || !role) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: email, password, nome, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de e-mail inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SERVER-SIDE PERMISSION CHECK - Critical security validation
    const allowedRoles = rolePermissions[currentUserRole] || [];
    if (!allowedRoles.includes(role)) {
      console.error(`User with role '${currentUserRole}' attempted to create user with role '${role}'`);
      return new Response(
        JSON.stringify({ error: `Você não tem permissão para criar usuários com o cargo '${role}'` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For directors, get their unit_id and force it for new users
    let finalUnidadeId = unidade_id;
    if (currentUserRole === 'diretor') {
      const { data: directorProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('unidade_id')
        .eq('id', currentUser.id)
        .single();
      
      if (profileError || !directorProfile?.unidade_id) {
        console.error('Director has no unit assigned:', profileError);
        return new Response(
          JSON.stringify({ error: 'Você não está vinculado a nenhuma unidade' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      finalUnidadeId = directorProfile.unidade_id;
    }

    console.log(`Creating user: ${email} with role: ${role}`);

    // Create the user using admin API
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { nome }
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      if (createError.message?.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já está cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário: ' + createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      console.error('No user returned from createUser');
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;
    console.log('Created user with ID:', newUserId);

    // Update profile with additional data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        matricula: matricula || null,
        unidade_id: finalUnidadeId || null,
      })
      .eq('id', newUserId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't fail the request, profile update is secondary
    }

    // Update role if not professor (trigger creates professor by default)
    if (role !== 'professor') {
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', newUserId);

      if (roleUpdateError) {
        console.error('Error updating role:', roleUpdateError);
        // This is more critical, but user is already created
      }
    }

    // If creating an administrator, add admin_unidades records
    if (role === 'administrador' && admin_unidades && Array.isArray(admin_unidades) && admin_unidades.length > 0) {
      const adminUnidadesRecords = admin_unidades.map((unidadeId: string) => ({
        admin_id: newUserId,
        unidade_id: unidadeId,
      }));

      const { error: adminUnidadesError } = await supabaseAdmin
        .from('admin_unidades')
        .insert(adminUnidadesRecords);

      if (adminUnidadesError) {
        console.error('Error creating admin_unidades:', adminUnidadesError);
        // Don't fail, admin is already created
      }
    }

    console.log('User creation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUserId,
        message: 'Usuário criado com sucesso' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
