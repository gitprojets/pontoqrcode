import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemedLogo } from '@/components/ThemedLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ escolas: 0, usuarios: 0, leituras: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Using count queries that may fail silently if RLS blocks access
        const [escolasRes, usuariosRes, leiturasRes] = await Promise.allSettled([
          supabase.from('unidades').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('registros_frequencia').select('id', { count: 'exact', head: true }).eq('data_registro', new Date().toISOString().split('T')[0])
        ]);
        
        setStats({
          escolas: escolasRes.status === 'fulfilled' ? (escolasRes.value.count || 0) : 0,
          usuarios: usuariosRes.status === 'fulfilled' ? (usuariosRes.value.count || 0) : 0,
          leituras: leiturasRes.status === 'fulfilled' ? (leiturasRes.value.count || 0) : 0
        });
      } catch (error) {
        // Silently fail - stats are not critical for login
        console.warn('Could not fetch login stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('E-mail ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Confirme seu e-mail antes de fazer login');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Digite seu e-mail primeiro');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      toast.error('Erro ao enviar e-mail de recuperação');
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
              <ThemedLogo className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl" />
              <div>
                <h1 className="text-2xl xl:text-3xl font-display font-bold">FrequênciaQR</h1>
                <p className="text-sidebar-foreground/70 text-sm">Sistema de Frequência Escolar</p>
              </div>
            </div>
            
            <h2 className="text-2xl xl:text-4xl font-display font-bold leading-tight mb-4 xl:mb-6">
              Gestão Escolar Ágil
            </h2>
            
            <p className="text-base xl:text-lg text-sidebar-foreground/80 max-w-md">
              Registre a frequência de professores, alunos e colaboradores com 
              tecnologia QR Code. Relatórios em tempo real e total controle.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 xl:gap-4">
            {[
              { label: 'Escolas', value: stats.escolas },
              { label: 'Usuários', value: stats.usuarios },
              { label: 'Leituras/dia', value: stats.leituras },
            ].map((stat) => (
              <div key={stat.label} className="bg-sidebar-foreground/10 rounded-xl p-3 xl:p-4">
                <p className="text-xl xl:text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs xl:text-sm text-sidebar-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <ThemedLogo className="w-12 h-12 rounded-xl" />
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">FrequênciaQR</h1>
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Faça login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground">Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Esqueci a senha
              </button>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Contact admin message */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <span className="text-foreground">
                Entre em contato com o administrador do sistema.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}