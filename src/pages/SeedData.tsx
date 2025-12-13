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
} from 'lucide-react';
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
  professores: number;
  unidades: number;
  total: number;
}

interface SeedConfig {
  unidades: number;
  administradores: number;
  diretores: number;
  professores: number;
}

export default function SeedData() {
  const { role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Limites para evitar timeout da edge function
  const MAX_LIMITS = {
    unidades: 50,
    administradores: 20,
    diretores: 50,
    professores: 100,
  };
  
  const [config, setConfig] = useState<SeedConfig>({
    unidades: 10,
    administradores: 5,
    diretores: 10,
    professores: 50,
  });

  const totalUsuarios = config.administradores + config.diretores + config.professores;

  const handleConfigChange = (field: keyof SeedConfig, value: string) => {
    const numValue = parseInt(value) || 0;
    const maxLimit = MAX_LIMITS[field];
    setConfig(prev => ({
      ...prev,
      [field]: Math.min(Math.max(0, numValue), maxLimit)
    }));
  };

  const handleSeed = async () => {
    setIsConfirmOpen(false);
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      toast.info('Iniciando criação de dados de demonstração...', {
        description: 'Isso pode levar alguns minutos.',
        duration: 10000,
      });

      const { data, error: fnError } = await supabase.functions.invoke('seed-demo-data', {
        body: config
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

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Gerador de Dados de Demonstração
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure e crie dados fictícios para testar o sistema
          </p>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="unidades" className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-primary" />
                Unidades/Escolas
              </Label>
              <Input
                id="unidades"
                type="number"
                min={0}
                max={MAX_LIMITS.unidades}
                value={config.unidades}
                onChange={(e) => handleConfigChange('unidades', e.target.value)}
                className="text-center text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground text-center">máx: {MAX_LIMITS.unidades}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="administradores" className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-warning" />
                Administradores
              </Label>
              <Input
                id="administradores"
                type="number"
                min={0}
                max={MAX_LIMITS.administradores}
                value={config.administradores}
                onChange={(e) => handleConfigChange('administradores', e.target.value)}
                className="text-center text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground text-center">máx: {MAX_LIMITS.administradores}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="diretores" className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-secondary" />
                Diretores
              </Label>
              <Input
                id="diretores"
                type="number"
                min={0}
                max={MAX_LIMITS.diretores}
                value={config.diretores}
                onChange={(e) => handleConfigChange('diretores', e.target.value)}
                className="text-center text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground text-center">máx: {MAX_LIMITS.diretores}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="professores" className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                Professores
              </Label>
              <Input
                id="professores"
                type="number"
                min={0}
                max={MAX_LIMITS.professores}
                value={config.professores}
                onChange={(e) => handleConfigChange('professores', e.target.value)}
                className="text-center text-lg font-bold"
              />
              <p className="text-xs text-muted-foreground text-center">máx: {MAX_LIMITS.professores}</p>
            </div>
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

          {result && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium text-success">Dados criados com sucesso!</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
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
                      <p className="text-lg font-bold text-foreground">{result.professores}</p>
                      <p className="text-xs text-muted-foreground">Professores</p>
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
            <AlertDialogDescription>
              Você está prestes a criar:
              <ul className="mt-2 space-y-1">
                <li>• {config.unidades} unidades</li>
                <li>• {config.administradores} administradores</li>
                <li>• {config.diretores} diretores</li>
                <li>• {config.professores} professores</li>
              </ul>
              <p className="mt-2">Total: {config.unidades + totalUsuarios} registros</p>
              <p className="mt-2 font-medium">Deseja continuar?</p>
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
    </MainLayout>
  );
}
