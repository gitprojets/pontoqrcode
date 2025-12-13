import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brazilian first names
const firstNames = [
  'Ana', 'Maria', 'José', 'João', 'Pedro', 'Paulo', 'Carlos', 'Lucas', 'Marcos', 'Antônio',
  'Francisco', 'Luiz', 'Rafael', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Fernando', 'Ricardo', 'Rodrigo',
  'Adriana', 'Aline', 'Amanda', 'Beatriz', 'Bruna', 'Camila', 'Carolina', 'Cláudia', 'Cristina', 'Daniela',
  'Débora', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Letícia', 'Luciana', 'Mariana',
  'Michele', 'Natália', 'Patrícia', 'Paula', 'Priscila', 'Raquel', 'Renata', 'Sandra', 'Simone', 'Tatiana',
  'Vanessa', 'Alessandra', 'Alexandra', 'Alice', 'Andréia', 'Ângela', 'Bianca', 'Carla', 'Célia', 'Denise',
  'Leonardo', 'Gabriel', 'Guilherme', 'Gustavo', 'Hugo', 'Igor', 'Ivan', 'Leandro', 'Lúcio', 'Mateus',
  'Alexandre', 'André', 'Caio', 'César', 'Cláudio', 'Diego', 'Edson', 'Elias', 'Fábio', 'Felipe'
];

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
];

const schoolNames = [
  'Escola Municipal Prof. Maria José', 'Escola Municipal João Paulo II', 'Escola Estadual Tiradentes',
  'Escola Municipal Rui Barbosa', 'Escola Estadual Dom Pedro I', 'Colégio Municipal Castro Alves',
  'Escola Municipal Machado de Assis', 'Escola Estadual Monteiro Lobato', 'CEMEI Criança Feliz',
  'Escola Municipal Santos Dumont', 'Escola Estadual Princesa Isabel', 'Escola Municipal Villa Lobos',
  'EMEF Prof. Carlos Drummond', 'Escola Municipal Cecília Meireles', 'Escola Estadual Anísio Teixeira',
  'Escola Municipal Paulo Freire', 'Colégio Estadual Darcy Ribeiro', 'Escola Municipal Oswaldo Cruz',
  'EMEF José de Alencar', 'Escola Municipal Cândido Portinari', 'Escola Estadual Juscelino Kubitschek',
  'Escola Municipal Tarsila do Amaral', 'Escola Estadual Villa-Lobos', 'CEMEI Pequeno Príncipe',
  'Escola Municipal Di Cavalcanti', 'Escola Estadual Oscar Niemeyer', 'Colégio Municipal Zilda Arns',
  'Escola Municipal Irmã Dulce', 'Escola Estadual Chico Mendes', 'EMEF Marina Silva'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
  const firstName = getRandomElement(firstNames);
  const lastName1 = getRandomElement(lastNames);
  const lastName2 = getRandomElement(lastNames);
  return `${firstName} ${lastName1} ${lastName2}`;
}

function generateEmail(name: string, index: number, role: string): string {
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.');
  const random = Math.floor(Math.random() * 10000);
  return `${cleanName}.${index}.${random}@${role === 'professor' ? 'prof' : role}.edu.br`;
}

function generateMatricula(role: string, index: number): string {
  const prefixes: Record<string, string> = {
    professor: 'PROF',
    diretor: 'DIR',
    administrador: 'ADM',
  };
  return `${prefixes[role] || 'USR'}${String(index).padStart(5, '0')}`;
}

interface SeedConfig {
  unidades: number;
  administradores: number;
  diretores: number;
  professores: number;
}

interface SeedResults {
  administradores: number;
  diretores: number;
  professores: number;
  unidades: number;
  errors: string[];
}

// Max limits to prevent timeouts
const MAX_LIMITS = {
  unidades: 50,
  administradores: 20,
  diretores: 50,
  professores: 100,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse config from request body with limits
    let config: SeedConfig = {
      unidades: 10,
      administradores: 5,
      diretores: 10,
      professores: 50,
    };

    try {
      const body = await req.json();
      if (body) {
        config = {
          unidades: Math.min(Math.max(0, body.unidades || 0), MAX_LIMITS.unidades),
          administradores: Math.min(Math.max(0, body.administradores || 0), MAX_LIMITS.administradores),
          diretores: Math.min(Math.max(0, body.diretores || 0), MAX_LIMITS.diretores),
          professores: Math.min(Math.max(0, body.professores || 0), MAX_LIMITS.professores),
        };
      }
    } catch {
      // Use defaults if body parsing fails
    }

    console.log('Seed config (with limits):', config);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseUser = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: currentUser } } = await supabaseUser.auth.getUser();
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userRole } = await supabaseAdmin.rpc('get_user_role', { _user_id: currentUser.id });
    
    if (userRole !== 'desenvolvedor') {
      return new Response(
        JSON.stringify({ error: 'Apenas desenvolvedores podem executar esta função' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SeedResults = {
      administradores: 0,
      diretores: 0,
      professores: 0,
      unidades: 0,
      errors: [],
    };

    const defaultPassword = 'Senha@123';

    // Step 1: Create Units
    let unidadeIds: string[] = [];
    
    // Get existing units
    const { data: existingUnits } = await supabaseAdmin.from('unidades').select('id');
    unidadeIds = existingUnits?.map(u => u.id) || [];

    if (config.unidades > 0) {
      console.log(`Creating ${config.unidades} units...`);
      for (let i = 0; i < config.unidades; i++) {
        const schoolName = i < schoolNames.length 
          ? schoolNames[i] 
          : `Escola Municipal ${generateName().split(' ')[0]} ${i + 1}`;
        
        const { data: unit, error: unitError } = await supabaseAdmin
          .from('unidades')
          .insert({
            nome: schoolName,
            endereco: `Rua ${getRandomElement(lastNames)}, ${Math.floor(Math.random() * 1000) + 1}`,
            telefone: `(11) ${Math.floor(Math.random() * 90000000 + 10000000)}`,
            status: 'online',
          })
          .select('id')
          .single();

        if (unitError) {
          if (!unitError.message.includes('duplicate')) {
            results.errors.push(`Unidade ${i}: ${unitError.message}`);
          }
        } else if (unit) {
          unidadeIds.push(unit.id);
          results.unidades++;
        }
      }
      console.log(`Created ${results.unidades} units`);
    }

    if (unidadeIds.length === 0 && (config.diretores > 0 || config.professores > 0)) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma unidade encontrada. Crie pelo menos 1 unidade primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get current counts
    const { count: admCount } = await supabaseAdmin.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'administrador');
    const { count: dirCount } = await supabaseAdmin.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'diretor');
    const { count: profCount } = await supabaseAdmin.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'professor');
    
    const existingAdm = admCount || 0;
    const existingDir = dirCount || 0;
    const existingProf = profCount || 0;

    // Step 3: Create Admins
    if (config.administradores > 0) {
      console.log(`Creating ${config.administradores} administrators...`);
      for (let i = 1; i <= config.administradores; i++) {
        const nome = generateName();
        const email = generateEmail(nome, existingAdm + i, 'administrador');
        
        try {
          const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { nome }
          });

          if (createError) {
            if (!createError.message.includes('already been registered')) {
              results.errors.push(`Admin ${i}: ${createError.message}`);
            }
            continue;
          }

          if (authData.user) {
            await supabaseAdmin.from('profiles').update({ 
              matricula: generateMatricula('administrador', existingAdm + i) 
            }).eq('id', authData.user.id);
            
            await supabaseAdmin.from('user_roles').update({ role: 'administrador' }).eq('user_id', authData.user.id);
            results.administradores++;
          }
        } catch (e) {
          results.errors.push(`Admin ${i}: ${e}`);
        }
      }
      console.log(`Created ${results.administradores} administrators`);
    }

    // Step 4: Create Directors
    if (config.diretores > 0 && unidadeIds.length > 0) {
      console.log(`Creating ${config.diretores} directors...`);
      for (let i = 1; i <= config.diretores; i++) {
        const nome = generateName();
        const email = generateEmail(nome, existingDir + i, 'diretor');
        const unidadeId = unidadeIds[(i - 1) % unidadeIds.length];
        
        try {
          const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { nome }
          });

          if (createError) {
            if (!createError.message.includes('already been registered')) {
              results.errors.push(`Diretor ${i}: ${createError.message}`);
            }
            continue;
          }

          if (authData.user) {
            await supabaseAdmin.from('profiles').update({ 
              matricula: generateMatricula('diretor', existingDir + i),
              unidade_id: unidadeId
            }).eq('id', authData.user.id);
            
            await supabaseAdmin.from('user_roles').update({ role: 'diretor' }).eq('user_id', authData.user.id);
            results.diretores++;
          }
        } catch (e) {
          results.errors.push(`Diretor ${i}: ${e}`);
        }
      }
      console.log(`Created ${results.diretores} directors`);
    }

    // Step 5: Create Professors
    if (config.professores > 0 && unidadeIds.length > 0) {
      console.log(`Creating ${config.professores} professors...`);
      for (let i = 1; i <= config.professores; i++) {
        const nome = generateName();
        const email = generateEmail(nome, existingProf + i, 'professor');
        const unidadeId = unidadeIds[(i - 1) % unidadeIds.length];
        
        try {
          const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { nome }
          });

          if (createError) {
            if (!createError.message.includes('already been registered')) {
              results.errors.push(`Prof ${i}: ${createError.message}`);
            }
            continue;
          }

          if (authData.user) {
            await supabaseAdmin.from('profiles').update({ 
              matricula: generateMatricula('professor', existingProf + i),
              unidade_id: unidadeId
            }).eq('id', authData.user.id);
            
            results.professores++;
          }
        } catch (e) {
          results.errors.push(`Prof ${i}: ${e}`);
        }

        // Log progress
        if (i % 20 === 0) {
          console.log(`Created ${i}/${config.professores} professors...`);
        }
      }
      console.log(`Created ${results.professores} professors`);
    }

    console.log('=== SEED COMPLETED ===');
    console.log(JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados criados com sucesso!',
        created: {
          ...results,
          total: results.administradores + results.diretores + results.professores + results.unidades
        },
        limits: MAX_LIMITS
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno: ' + (error instanceof Error ? error.message : 'Unknown') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});