import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Key, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoImage from '@/assets/logo.png';

export default function Setup() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !email.trim() || !password || !setupKey.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-initial-user', {
        body: { 
          nome: nome.trim(), 
          email: email.trim(), 
          password, 
          setupKey: setupKey.trim() 
        }
      });

      if (error) {
        toast.error('Erro ao criar usuário: ' + error.message);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success) {
        toast.success('Usuário desenvolvedor criado com sucesso!');
        toast.info('Faça login com suas credenciais');
        navigate('/login');
      }
    } catch (error) {
      toast.error('Erro ao configurar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 sidebar-gradient relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-sidebar-foreground/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-sidebar-foreground/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-8 xl:p-12 text-sidebar-foreground">
          <div className="mb-8 xl:mb-12">
            <div className="flex items-center gap-4 mb-6 xl:mb-8">
              <img src={logoImage} alt="FrequênciaQR" className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl" />
              <div>
                <h1 className="text-2xl xl:text-3xl font-display font-bold">FrequênciaQR</h1>
                <p className="text-sidebar-foreground/70 text-sm">Configuração Inicial</p>
              </div>
            </div>
            
            <h2 className="text-2xl xl:text-4xl font-display font-bold leading-tight mb-4 xl:mb-6">
              Primeiro acesso<br />
              ao sistema
            </h2>
            
            <p className="text-base xl:text-lg text-sidebar-foreground/80 max-w-md">
              Configure o primeiro usuário desenvolvedor para ter acesso 
              completo ao sistema de gestão de frequência.
            </p>
          </div>

          <div className="bg-sidebar-foreground/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-sidebar-foreground" />
              <div>
                <p className="font-semibold">Acesso Desenvolvedor</p>
                <p className="text-sm text-sidebar-foreground/70">Controle total do sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Setup Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <img src={logoImage} alt="FrequênciaQR" className="w-12 h-12 rounded-xl" />
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">FrequênciaQR</h1>
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Configuração Inicial
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Crie o primeiro usuário desenvolvedor
            </p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Chave de Setup
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Chave secreta de configuração"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A chave de setup foi configurada nos secrets do projeto.
              </p>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Configurando...' : 'Criar Usuário Desenvolvedor'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
