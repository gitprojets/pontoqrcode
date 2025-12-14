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
  const domain = role === 'professor' ? 'prof' : role;
  return `${cleanName}.${index}.${random}@${domain}.edu.br`;
}

function generateMatricula(role: string, index: number): string {
  const prefixes: Record<string, string> = {
    professor: 'PROF',
    diretor: 'DIR',
    administrador: 'ADM',
    coordenador: 'COORD',
    secretario: 'SEC',
    vigia: 'VIG',
    zeladora: 'ZEL',
    merendeira: 'MER',
    assistente: 'ASS',
    digitador: 'DIG',
  };
  return `${prefixes[role] || 'USR'}${String(index).padStart(5, '0')}`;
}

interface SeedConfig {
  unidades: number;
  administradores: number;
  diretores: number;
  coordenadores: number;
  secretarios: number;
  professores: number;
  vigias: number;
  zeladoras: number;
  merendeiras: number;
  assistentes: number;
  digitadores: number;
}

interface SeedResults {
  administradores: number;
  diretores: number;
  coordenadores: number;
  secretarios: number;
  professores: number;
  vigias: number;
  zeladoras: number;
  merendeiras: number;
  assistentes: number;
  digitadores: number;
  unidades: number;
  deletedUsers: number;
  deletedUnits: number;
  errors: string[];
}

// Max limits to prevent timeouts - must match frontend
const MAX_LIMITS = {
  unidades: 500,
  administradores: 1000,
  diretores: 1000,
  coordenadores: 500,
  secretarios: 500,
  professores: 5000,
  vigias: 200,
  zeladoras: 200,
  merendeiras: 200,
  assistentes: 200,
  digitadores: 200,
};

// Role mapping - these roles use 'outro' as base role
const ROLE_EMAIL_PATTERNS = [
  '@prof.edu.br',
  '@diretor.edu.br', 
  '@administrador.edu.br',
  '@coordenador.edu.br',
  '@secretario.edu.br',
  '@vigia.edu.br',
  '@zeladora.edu.br',
  '@merendeira.edu.br',
  '@assistente.edu.br',
  '@digitador.edu.br',
];

// Map email domain to actual role in database
const EMAIL_TO_ROLE: Record<string, string> = {
  'prof': 'professor',
  'diretor': 'diretor',
  'administrador': 'administrador',
  'coordenador': 'coordenador',
  'secretario': 'secretario',
  'vigia': 'outro',
  'zeladora': 'outro',
  'merendeira': 'outro',
  'assistente': 'outro',
  'digitador': 'outro',
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
      coordenadores: 5,
      secretarios: 5,
      professores: 50,
      vigias: 5,
      zeladoras: 5,
      merendeiras: 5,
      assistentes: 5,
      digitadores: 5,
    };
    let clearExisting = false;

    try {
      const body = await req.json();
      if (body) {
        config = {
          unidades: Math.min(Math.max(0, body.unidades || 0), MAX_LIMITS.unidades),
          administradores: Math.min(Math.max(0, body.administradores || 0), MAX_LIMITS.administradores),
          diretores: Math.min(Math.max(0, body.diretores || 0), MAX_LIMITS.diretores),
          coordenadores: Math.min(Math.max(0, body.coordenadores || 0), MAX_LIMITS.coordenadores),
          secretarios: Math.min(Math.max(0, body.secretarios || 0), MAX_LIMITS.secretarios),
          professores: Math.min(Math.max(0, body.professores || 0), MAX_LIMITS.professores),
          vigias: Math.min(Math.max(0, body.vigias || 0), MAX_LIMITS.vigias),
          zeladoras: Math.min(Math.max(0, body.zeladoras || 0), MAX_LIMITS.zeladoras),
          merendeiras: Math.min(Math.max(0, body.merendeiras || 0), MAX_LIMITS.merendeiras),
          assistentes: Math.min(Math.max(0, body.assistentes || 0), MAX_LIMITS.assistentes),
          digitadores: Math.min(Math.max(0, body.digitadores || 0), MAX_LIMITS.digitadores),
        };
        clearExisting = body.clearExisting === true;
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
      coordenadores: 0,
      secretarios: 0,
      professores: 0,
      vigias: 0,
      zeladoras: 0,
      merendeiras: 0,
      assistentes: 0,
      digitadores: 0,
      unidades: 0,
      deletedUsers: 0,
      deletedUnits: 0,
      errors: [],
    };

    const defaultPassword = 'Senha@123';

    // Step 0: Clear existing data if requested
    if (clearExisting) {
      console.log('Clearing existing demo data...');
      
      // Get ALL profiles that have demo email patterns (excluding the current user)
      for (const pattern of ROLE_EMAIL_PATTERNS) {
        let hasMore = true;
        let offset = 0;
        const batchSize = 100;
        
        while (hasMore) {
          const { data: demoUsers, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .neq('id', currentUser.id)
            .ilike('email', `%${pattern}`)
            .range(offset, offset + batchSize - 1);
          
          if (fetchError) {
            console.error('Error fetching demo users:', fetchError);
            break;
          }

          if (!demoUsers || demoUsers.length === 0) {
            hasMore = false;
            break;
          }
          
          console.log(`Found ${demoUsers.length} demo users with pattern ${pattern} at offset ${offset}`);
          
          // Delete users from auth (this will cascade to profiles and user_roles)
          for (const user of demoUsers) {
            try {
              const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
              if (!deleteError) {
                results.deletedUsers++;
              } else {
                console.error(`Error deleting user ${user.id}:`, deleteError);
              }
            } catch (e) {
              console.error(`Error deleting user ${user.id}:`, e);
            }
          }
          
          if (demoUsers.length < batchSize) {
            hasMore = false;
          } else {
            offset += batchSize;
          }
        }
      }
      
      console.log(`Deleted ${results.deletedUsers} demo users`);

      // Delete ALL demo units - units that don't have a real director assigned
      let hasMoreUnits = true;
      let unitOffset = 0;
      
      while (hasMoreUnits) {
        const { data: demoUnits, error: unitFetchError } = await supabaseAdmin
          .from('unidades')
          .select('id, nome')
          .is('diretor_id', null)
          .range(unitOffset, unitOffset + 99);
        
        if (unitFetchError) {
          console.error('Error fetching demo units:', unitFetchError);
          break;
        }

        if (!demoUnits || demoUnits.length === 0) {
          hasMoreUnits = false;
          break;
        }

        console.log(`Found ${demoUnits.length} demo units to delete at offset ${unitOffset}`);
        
        // Delete each unit individually to ensure cascading works
        for (const unit of demoUnits) {
          try {
            // First delete any related records
            await supabaseAdmin.from('registros_frequencia').delete().eq('unidade_id', unit.id);
            await supabaseAdmin.from('escalas_trabalho').delete().eq('unidade_id', unit.id);
            await supabaseAdmin.from('dispositivos').delete().eq('unidade_id', unit.id);
            await supabaseAdmin.from('school_events').delete().eq('unidade_id', unit.id);
            await supabaseAdmin.from('justificativas').delete().eq('unidade_id', unit.id);
            
            // Remove unidade_id from profiles linked to this unit
            await supabaseAdmin.from('profiles').update({ unidade_id: null }).eq('unidade_id', unit.id);
            
            // Then delete the unit
            const { error: deleteUnitError } = await supabaseAdmin
              .from('unidades')
              .delete()
              .eq('id', unit.id);
              
            if (!deleteUnitError) {
              results.deletedUnits++;
            } else {
              console.error(`Error deleting unit ${unit.id}:`, deleteUnitError);
            }
          } catch (e) {
            console.error(`Error deleting unit ${unit.id}:`, e);
          }
        }
        
        if (demoUnits.length < 100) {
          hasMoreUnits = false;
        }
      }
      
      console.log(`Deleted ${results.deletedUnits} demo units`);
      console.log('Existing demo data cleared');
    }

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

    // Helper function to create users
    async function createUsers(
      roleKey: keyof SeedResults,
      roleName: string,
      dbRole: string,
      count: number,
      assignToUnit: boolean = false
    ) {
      if (count <= 0) return;
      
      console.log(`Creating ${count} ${roleName}...`);
      
      const { count: existingCount } = await supabaseAdmin
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', dbRole);
      
      const existing = existingCount || 0;
      
      for (let i = 1; i <= count; i++) {
        const nome = generateName();
        const email = generateEmail(nome, existing + i, roleName);
        const unidadeId = assignToUnit && unidadeIds.length > 0 
          ? unidadeIds[(i - 1) % unidadeIds.length] 
          : null;
        
        try {
          const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { nome }
          });

          if (createError) {
            if (!createError.message.includes('already been registered')) {
              results.errors.push(`${roleName} ${i}: ${createError.message}`);
            }
            continue;
          }

          if (authData.user) {
            const updateData: Record<string, unknown> = { 
              matricula: generateMatricula(roleName, existing + i)
            };
            if (unidadeId) {
              updateData.unidade_id = unidadeId;
            }
            
            await supabaseAdmin.from('profiles').update(updateData).eq('id', authData.user.id);
            
            // Update role if different from default (professor)
            if (dbRole !== 'professor') {
              await supabaseAdmin.from('user_roles').update({ role: dbRole }).eq('user_id', authData.user.id);
            }
            
            (results[roleKey] as number)++;
          }
        } catch (e) {
          results.errors.push(`${roleName} ${i}: ${e}`);
        }

        // Log progress
        if (i % 20 === 0) {
          console.log(`Created ${i}/${count} ${roleName}...`);
        }
      }
      console.log(`Created ${results[roleKey]} ${roleName}`);
    }

    // Create all user types
    await createUsers('administradores', 'administrador', 'administrador', config.administradores, false);
    await createUsers('diretores', 'diretor', 'diretor', config.diretores, true);
    await createUsers('coordenadores', 'coordenador', 'coordenador', config.coordenadores, true);
    await createUsers('secretarios', 'secretario', 'secretario', config.secretarios, true);
    await createUsers('professores', 'professor', 'professor', config.professores, true);
    await createUsers('vigias', 'vigia', 'outro', config.vigias, true);
    await createUsers('zeladoras', 'zeladora', 'outro', config.zeladoras, true);
    await createUsers('merendeiras', 'merendeira', 'outro', config.merendeiras, true);
    await createUsers('assistentes', 'assistente', 'outro', config.assistentes, true);
    await createUsers('digitadores', 'digitador', 'outro', config.digitadores, true);

    const total = results.unidades + 
      results.administradores + 
      results.diretores + 
      results.coordenadores +
      results.secretarios +
      results.professores +
      results.vigias +
      results.zeladoras +
      results.merendeiras +
      results.assistentes +
      results.digitadores;

    console.log('=== SEED COMPLETED ===');
    console.log(JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dados criados com sucesso!',
        created: {
          administradores: results.administradores,
          diretores: results.diretores,
          coordenadores: results.coordenadores,
          secretarios: results.secretarios,
          professores: results.professores,
          vigias: results.vigias,
          zeladoras: results.zeladoras,
          merendeiras: results.merendeiras,
          assistentes: results.assistentes,
          digitadores: results.digitadores,
          unidades: results.unidades,
          total
        },
        deleted: {
          users: results.deletedUsers,
          units: results.deletedUnits,
        },
        errors: results.errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
