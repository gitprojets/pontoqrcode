import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Database,
  Users,
  Building,
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  UserCheck,
  ClipboardList,
  Eye,
  Utensils,
  Brush,
  UserCog,
  Keyboard,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SeedResult {
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
  total: number;
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

export default function SeedData() {
  const { role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearExisting, setClearExisting] = useState(true);
  
  // Limites máximos configurados
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
  
  const [config, setConfig] = useState<SeedConfig>({
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
  });

  const totalUsuarios = 
    config.administradores + 
    config.diretores + 
    config.coordenadores + 
    config.secretarios + 
    config.professores + 
    config.vigias + 
    config.zeladoras + 
    config.merendeiras + 
    config.assistentes + 
    config.digitadores;

  const handleConfigChange = (field: keyof SeedConfig, value: string) => {
    const numValue = parseInt(value) || 0;
    const maxLimit = MAX_LIMITS[field];
    setConfig(prev => ({
      ...prev,
      [field]: Math.min(Math.max(0, numValue), maxLimit)
    }));
  };

  const handleClearAllData = async () => {
    setIsClearAllConfirmOpen(false);
    setIsClearingAll(true);
    setResult(null);
    setError(null);

    try {
      toast.info('Limpando todos os dados de teste...', {
        description: 'Aguarde enquanto os dados são removidos.',
        duration: 5000,
      });

      const { data, error: fnError } = await supabase.functions.invoke('seed-demo-data', {
        body: { 
          unidades: 0,
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
          clearExisting: true 
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Todos os dados de teste foram removidos!', {
        description: 'O banco de dados foi limpo com sucesso.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast.error('Erro ao limpar dados', { description: message });
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleSeed = async () => {
    setIsConfirmOpen(false);
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      toast.info(clearExisting ? 'Limpando dados existentes e criando novos...' : 'Iniciando criação de dados de teste...', {
        description: 'Isso pode levar alguns minutos.',
        duration: 10000,
      });

      const { data, error: fnError } = await supabase.functions.invoke('seed-demo-data', {
        body: { ...config, clearExisting }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success) {
        setResult(data.created);
        toast.success('Dados criados com sucesso!', {
          description: `${data.created.total} registros criados.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast.error('Erro ao criar dados', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (role !== 'desenvolvedor') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Apenas desenvolvedores podem acessar esta página.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const configFields = [
    { key: 'unidades', label: 'Unidades/Escolas', icon: Building, color: 'text-primary' },
    { key: 'administradores', label: 'Administradores', icon: Shield, color: 'text-warning' },
    { key: 'diretores', label: 'Diretores', icon: Building, color: 'text-secondary' },
    { key: 'coordenadores', label: 'Coordenadores', icon: UserCheck, color: 'text-info' },
    { key: 'secretarios', label: 'Secretários', icon: ClipboardList, color: 'text-success' },
    { key: 'professores', label: 'Professores', icon: Users, color: 'text-primary' },
    { key: 'vigias', label: 'Vigias', icon: Eye, color: 'text-orange-500' },
    { key: 'zeladoras', label: 'Zeladoras', icon: Brush, color: 'text-pink-500' },
    { key: 'merendeiras', label: 'Merendeiras', icon: Utensils, color: 'text-amber-500' },
    { key: 'assistentes', label: 'Assistentes', icon: UserCog, color: 'text-cyan-500' },
    { key: 'digitadores', label: 'Digitadores', icon: Keyboard, color: 'text-violet-500' },
  ] as const;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Gerador de Dados de Teste
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure e crie dados realistas para testar o sistema (simula usuários e escolas reais)
          </p>
        </div>

        {/* Botão para limpar todos os dados */}
        <div className="card-elevated p-6 border-2 border-destructive/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 rounded-xl">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Limpar Todos os Dados de Teste
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Remove todos os usuários e unidades criados pelo seed. Seu usuário atual será mantido.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsClearAllConfirmOpen(true)}
              disabled={isLoading || isClearingAll}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              {isClearingAll ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Limpar Tudo
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="card-elevated p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Configuração do Seed
              </h2>
              <p className="text-muted-foreground text-sm">
                Defina a quantidade de dados que deseja gerar para cada categoria:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {configFields.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="flex items-center gap-2 text-sm">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="truncate">{label}</span>
                </Label>
                <Input
                  id={key}
                  type="number"
                  min={0}
                  max={MAX_LIMITS[key]}
                  value={config[key]}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                  className="text-center text-lg font-bold"
                />
                <p className="text-xs text-muted-foreground text-center">máx: {MAX_LIMITS[key]}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de registros a criar:</span>
              <span className="text-2xl font-bold text-foreground">
                {config.unidades + totalUsuarios}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {config.unidades} unidades + {totalUsuarios} usuários
            </div>
          </div>

          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Atenção</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta operação criará dados no banco de dados. Isso pode levar alguns minutos dependendo da quantidade.
                  Todos os usuários terão a senha padrão: <code className="bg-muted px-1 rounded">Senha@123</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
            <Checkbox
              id="clearExisting"
              checked={clearExisting}
              onCheckedChange={(checked) => setClearExisting(checked === true)}
            />
            <div className="flex-1">
              <label
                htmlFor="clearExisting"
                className="flex items-center gap-2 text-sm font-medium cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
                Limpar dados de demonstração existentes antes de criar novos
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Remove todos os usuários e unidades criados anteriormente pelo seed (não afeta seu usuário atual)
              </p>
            </div>
          </div>

          {result && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-success">Dados criados com sucesso!</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.unidades}</p>
                      <p className="text-xs text-muted-foreground">Unidades</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.administradores}</p>
                      <p className="text-xs text-muted-foreground">Administradores</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.diretores}</p>
                      <p className="text-xs text-muted-foreground">Diretores</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.coordenadores}</p>
                      <p className="text-xs text-muted-foreground">Coordenadores</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.secretarios}</p>
                      <p className="text-xs text-muted-foreground">Secretários</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.professores}</p>
                      <p className="text-xs text-muted-foreground">Professores</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.vigias}</p>
                      <p className="text-xs text-muted-foreground">Vigias</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.zeladoras}</p>
                      <p className="text-xs text-muted-foreground">Zeladoras</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.merendeiras}</p>
                      <p className="text-xs text-muted-foreground">Merendeiras</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.assistentes}</p>
                      <p className="text-xs text-muted-foreground">Assistentes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{result.digitadores}</p>
                      <p className="text-xs text-muted-foreground">Digitadores</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-3">
                    Total: {result.total} registros criados
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={() => setIsConfirmOpen(true)}
            disabled={isLoading || (config.unidades === 0 && totalUsuarios === 0)}
            variant="gradient"
            size="lg"
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando dados... isso pode levar alguns minutos
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Gerar {config.unidades + totalUsuarios} Registros
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Geração de Dados</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {clearExisting && (
                  <p className="text-destructive font-medium mb-2">
                    ⚠️ Os dados de teste existentes serão removidos primeiro!
                  </p>
                )}
                <p>Você está prestes a criar:</p>
                <ul className="mt-2 space-y-1">
                  <li>• {config.unidades} unidades</li>
                  <li>• {config.administradores} administradores</li>
                  <li>• {config.diretores} diretores</li>
                  <li>• {config.coordenadores} coordenadores</li>
                  <li>• {config.secretarios} secretários</li>
                  <li>• {config.professores} professores</li>
                  <li>• {config.vigias} vigias</li>
                  <li>• {config.zeladoras} zeladoras</li>
                  <li>• {config.merendeiras} merendeiras</li>
                  <li>• {config.assistentes} assistentes</li>
                  <li>• {config.digitadores} digitadores</li>
                </ul>
                <p className="mt-2">Total: {config.unidades + totalUsuarios} registros</p>
                <p className="mt-2 font-medium">Deseja continuar?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeed}>
              Sim, Gerar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isClearAllConfirmOpen} onOpenChange={setIsClearAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar Limpeza Total</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="text-destructive font-medium mb-2">
                  ⚠️ Esta ação é irreversível!
                </p>
                <p>
                  Todos os dados de teste serão permanentemente removidos:
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• Todos os usuários de teste (todos os cargos)</li>
                  <li>• Todas as unidades/escolas de teste</li>
                </ul>
                <p className="mt-2 font-medium">
                  Seu usuário atual será mantido. O Dashboard será atualizado automaticamente.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllData}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
