import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Play, Download, Shield, QrCode, BarChart3, Users, CheckCircle, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StatSkeletonRow } from '@/components/ui/stat-skeleton';
import { useCountAnimation } from '@/hooks/useCountAnimation';
import logoImage from '@/assets/logo-main.png';

const features = [
  {
    icon: QrCode,
    title: 'QR Code Dinâmico',
    description: 'Códigos QR que se renovam automaticamente para máxima segurança.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios em Tempo Real',
    description: 'Acompanhe a frequência de todos os colaboradores instantaneamente.',
  },
  {
    icon: Users,
    title: 'Gestão de Usuários',
    description: 'Controle de acesso por níveis: Professor, Diretor e Administrador.',
  },
  {
    icon: Shield,
    title: 'Segurança Avançada',
    description: 'Autenticação robusta e proteção de dados sensíveis.',
  },
];

interface AnimatedStatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  delay: number;
  isLoaded: boolean;
}

function AnimatedStatCard({ icon: Icon, value, label, delay, isLoaded }: AnimatedStatCardProps) {
  const { count } = useCountAnimation({ 
    end: value, 
    duration: 2000, 
    delay,
    enabled: isLoaded 
  });

  return (
    <div 
      className="bg-card border border-border rounded-xl p-4 transform transition-all duration-500 hover:scale-105 hover:shadow-lg"
      style={{ 
        animation: isLoaded ? `fadeSlideUp 0.6s ease-out ${delay}ms forwards` : 'none',
        opacity: isLoaded ? 1 : 0
      }}
    >
      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
      <p className="text-2xl font-display font-bold text-foreground tabular-nums">
        {count.toLocaleString('pt-BR')}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ escolas: 0, usuarios: 0, leituras: 0 });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isStatsLoaded, setIsStatsLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsStatsLoading(true);
        // Usar edge function para buscar estatísticas públicas (bypassa RLS)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-stats`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setStats({
            escolas: data.escolas || 0,
            usuarios: data.usuarios || 0,
            leituras: data.leituras || 0
          });
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setIsStatsLoading(false);
        // Small delay for animation to kick in
        setTimeout(() => setIsStatsLoaded(true), 100);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* CSS for animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-sidebar backdrop-blur-lg border-b border-sidebar-border shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="FrequênciaQR" className="w-10 h-10 rounded-xl shadow-sm" />
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-sidebar-foreground text-lg">FrequênciaQR</h1>
              <span className="text-xs text-sidebar-foreground/70">Sistema de Frequência</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link to="/demo" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <Play className="w-4 h-4 mr-2" />
                Demo
              </Button>
            </Link>
            <Link to="/install">
              <Button variant="outline" size="sm" className="border-sidebar-foreground/30 text-sidebar-foreground hover:bg-sidebar-accent">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Instalar</span>
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 shadow-md">
                <span className="hidden sm:inline">Entrar</span>
                <ArrowRight className="w-4 h-4 sm:ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              Sistema de Gestão de Frequência Escolar
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-foreground leading-tight">
              Gestão Escolar{' '}
              <span className="text-primary">
                Ágil
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie a presença de professores e colaboradores com tecnologia QR Code. 
              Simples, rápido e totalmente seguro.
            </p>

            {/* Stats Section */}
            {isStatsLoading ? (
              <StatSkeletonRow />
            ) : (
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
                <AnimatedStatCard 
                  icon={Building} 
                  value={stats.escolas} 
                  label="Escolas" 
                  delay={0}
                  isLoaded={isStatsLoaded}
                />
                <AnimatedStatCard 
                  icon={Users} 
                  value={stats.usuarios} 
                  label="Usuários" 
                  delay={150}
                  isLoaded={isStatsLoaded}
                />
                <AnimatedStatCard 
                  icon={BarChart3} 
                  value={stats.leituras} 
                  label="Leituras/dia" 
                  delay={300}
                  isLoaded={isStatsLoaded}
                />
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:min-w-[200px] shadow-lg hover:shadow-xl transition-shadow">
                  Acessar Sistema
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/demo" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:min-w-[200px]">
                  <Play className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="p-6 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
                style={{
                  animation: `fadeSlideUp 0.6s ease-out ${index * 100 + 400}ms forwards`,
                  opacity: 0
                }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Setup Link for first-time users */}
          <div className="mt-16 text-center">
            <div className="inline-block p-6 bg-muted/50 rounded-xl border border-border">
              <p className="text-muted-foreground mb-3">Primeira vez configurando o sistema?</p>
              <Link to="/setup">
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Configuração Inicial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="FrequênciaQR" className="w-8 h-8 rounded-lg" />
              <span className="font-display font-semibold text-foreground">FrequênciaQR</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Sistema de Controle de Frequência Escolar
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;