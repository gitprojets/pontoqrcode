import { memo, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  QrCode,
  Calendar,
  FileText,
  Users,
  Settings,
  Shield,
  ClipboardList,
  Building,
  LogOut,
  ScanLine,
  Clock,
  X,
  Headphones,
  Database,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoImage from '@/assets/logo.png';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const menuItems: Record<string, MenuItem[]> = {
  professor: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: QrCode, label: 'Meu QR Code', path: '/qrcode' },
    { icon: ClipboardList, label: 'Histórico', path: '/historico' },
    { icon: FileText, label: 'Justificativas', path: '/justificativas' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  coordenador: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: ScanLine, label: 'Leitor QR Code', path: '/leitor' },
    { icon: Clock, label: 'Escalas', path: '/escalas' },
    { icon: Users, label: 'Funcionários', path: '/funcionarios' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  secretario: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: ScanLine, label: 'Leitor QR Code', path: '/leitor' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  diretor: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: ScanLine, label: 'Leitor QR Code', path: '/leitor' },
    { icon: Clock, label: 'Escalas', path: '/escalas' },
    { icon: Calendar, label: 'Calendário Escolar', path: '/calendario' },
    { icon: Users, label: 'Funcionários', path: '/funcionarios' },
    { icon: Users, label: 'Usuários', path: '/usuarios' },
    { icon: Building, label: 'Unidades', path: '/unidades' },
    { icon: FileText, label: 'Aprovações', path: '/aprovacoes' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  administrador: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: ScanLine, label: 'Leitor QR Code', path: '/leitor' },
    { icon: Building, label: 'Unidades', path: '/unidades' },
    { icon: Users, label: 'Usuários', path: '/usuarios' },
    { icon: QrCode, label: 'Dispositivos', path: '/dispositivos' },
    { icon: Calendar, label: 'Calendário Global', path: '/calendario' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Shield, label: 'Segurança', path: '/seguranca' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  desenvolvedor: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: ScanLine, label: 'Leitor QR Code', path: '/leitor' },
    { icon: Clock, label: 'Escalas', path: '/escalas' },
    { icon: Building, label: 'Unidades', path: '/unidades' },
    { icon: Users, label: 'Usuários', path: '/usuarios' },
    { icon: QrCode, label: 'Dispositivos', path: '/dispositivos' },
    { icon: Calendar, label: 'Calendário Global', path: '/calendario' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Shield, label: 'Segurança', path: '/seguranca' },
    { icon: Database, label: 'Seed de Dados', path: '/seed-data' },
    { icon: Headphones, label: 'Central de Suporte', path: '/suporte-admin' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  outro: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
};

const roleLabels: Record<string, string> = {
  professor: 'Professor',
  diretor: 'Diretor',
  administrador: 'Administrador',
  desenvolvedor: 'Desenvolvedor',
  coordenador: 'Coordenador',
  secretario: 'Secretário',
  outro: 'Usuário',
};

interface SidebarProps {
  onClose?: () => void;
}

const NavItem = memo(function NavItem({ item, isActive, onClick }: { item: MenuItem; isActive: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium truncate">{item.label}</span>
    </NavLink>
  );
});

NavItem.displayName = 'NavItem';

const Sidebar = memo(function Sidebar({ onClose }: SidebarProps) {
  const { profile, role, logout, isLoading } = useAuth();
  const location = useLocation();

  const handleNavClick = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const items = useMemo(() => {
    if (!role) return [];
    return menuItems[role] || menuItems.outro;
  }, [role]);

  const userInitials = useMemo(() => {
    if (!profile?.nome) return '??';
    return profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
  }, [profile?.nome]);

  if (isLoading || !profile || !role) {
    return (
      <aside className="h-screen w-64 sidebar-gradient flex items-center justify-center">
        <div className="animate-pulse text-sidebar-foreground/50">Carregando...</div>
      </aside>
    );
  }

  return (
    <aside className="h-screen w-64 sidebar-gradient flex flex-col">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="FrequênciaQR" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="font-display font-bold text-sidebar-foreground text-lg">
                FrequênciaQR
              </h1>
              <span className="text-xs text-sidebar-foreground/70">
                Sistema Escolar
              </span>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-semibold text-sm">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile.nome}
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              {roleLabels[role] || role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={handleNavClick}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/70">Tema</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export { Sidebar };
