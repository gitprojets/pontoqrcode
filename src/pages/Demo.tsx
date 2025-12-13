import { Link } from 'react-router-dom';
import { 
  QrCode, 
  Users, 
  Shield, 
  Code, 
  Building,
  ArrowRight,
  CheckCircle,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const demoCards = [
  {
    role: 'professor',
    title: 'Professor',
    description: 'Visualize sua frequência, QR Code pessoal e histórico de presenças',
    icon: Users,
    color: 'from-primary to-primary/70',
    features: ['Meu QR Code', 'Histórico de Presenças', 'Justificativas', 'Calendário'],
  },
  {
    role: 'diretor',
    title: 'Diretor',
    description: 'Gerencie funcionários, aprove justificativas e acompanhe relatórios',
    icon: Building,
    color: 'from-secondary to-secondary/70',
    features: ['Gestão de Funcionários', 'Aprovação de Justificativas', 'Relatórios', 'Calendário Escolar'],
  },
  {
    role: 'administrador',
    title: 'Administrador',
    description: 'Controle total sobre unidades, usuários e dispositivos do sistema',
    icon: Shield,
    color: 'from-warning to-warning/70',
    features: ['Gestão de Unidades', 'Cadastro de Usuários', 'Dispositivos QR', 'Relatórios Globais'],
  },
  {
    role: 'desenvolvedor',
    title: 'Desenvolvedor',
    description: 'Acesso completo para manutenção e melhorias do sistema',
    icon: Code,
    color: 'from-destructive to-destructive/70',
    features: ['Acesso Total', 'Segurança', 'Logs do Sistema', 'Configurações Avançadas'],
  },
];

export default function Demo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground text-lg">FrequênciaQR</h1>
              <span className="text-xs text-muted-foreground">Demonstração</span>
            </div>
          </Link>
          <Link to="/login">
            <Button variant="gradient">
              Entrar no Sistema
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
            Conheça o{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              FrequênciaQR
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Sistema moderno de controle de frequência escolar via QR Code. 
            Explore as demonstrações abaixo para conhecer cada tipo de acesso.
          </p>
        </div>
      </section>

      {/* Demo Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {demoCards.map((card) => (
            <Link
              key={card.role}
              to={`/demo/${card.role}`}
              className="group card-elevated p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {card.description}
                  </p>
                  <div className="space-y-2">
                    {card.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-success" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end text-primary font-medium text-sm">
                Ver demonstração
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
            Funcionalidades do Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">QR Code Único</h3>
              <p className="text-sm text-muted-foreground">
                Cada funcionário possui um QR Code exclusivo para registro de presença
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">Calendário Escolar</h3>
              <p className="text-sm text-muted-foreground">
                Gestão de dias letivos, feriados e eventos escolares
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                <ClipboardList className="w-8 h-8 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground">Relatórios Detalhados</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhamento em tempo real de frequência e estatísticas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 FrequênciaQR - Sistema de Controle de Frequência Escolar</p>
        </div>
      </footer>
    </div>
  );
}
