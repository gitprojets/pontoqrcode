import { memo, useCallback, useMemo, useState, useEffect } from 'react';
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
  Download,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemedLogo } from '@/components/ThemedLogo';

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
    { icon: Clock, label: 'Escalas', path: '/escalas' },
    { icon: Users, label: 'Funcionários', path: '/funcionarios' },
    { icon: FileText, label: 'Aprovações', path: '/aprovacoes' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  secretario: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: Users, label: 'Funcionários', path: '/funcionarios' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  diretor: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: ScanLine, label: 'Leitor QR Code', path: '/leitor' },
    { icon: Calendar, label: 'Calendário Escolar', path: '/calendario' },
    { icon: Users, label: 'Funcionários', path: '/funcionarios' },
    { icon: FileText, label: 'Aprovações', path: '/aprovacoes' },
    { icon: Building, label: 'Minha Unidade', path: '/unidades' },
    { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
    { icon: Headphones, label: 'Suporte', path: '/suporte' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  administrador: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: ClipboardList, label: 'Registros do Dia', path: '/registros-dia' },
    { icon: Clock, label: 'Escalas', path: '/escalas' },
    { icon: Building, label: 'Unidades', path: '/unidades' },
    { icon: Users, label: 'Usuários', path: '/usuarios' },
    { icon: QrCode, label: 'Dispositivos', path: '/dispositivos' },
    { icon: Calendar, label: 'Calendário', path: '/calendario' },
    { icon: FileText, label: 'Relatórios', path: '/relatorios' },
    { icon: Shield, label: 'Segurança', path: '/seguranca' },
    { icon: ScrollText, label: 'Logs de Auditoria', path: '/audit-logs' },
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
    { icon: ScrollText, label: 'Logs de Auditoria', path: '/audit-logs' },
    { icon: Database, label: 'Seed de Dados', path: '/seed-data' },
    { icon: Headphones, label: 'Central de Suporte', path: '/suporte-admin' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ],
  outro: [
    { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
    { icon: QrCode, label: 'Meu QR Code', path: '/qrcode' },
    { icon: ClipboardList, label: 'Histórico', path: '/historico' },
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
        'group flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all duration-200 relative overflow-hidden',
        isActive
          ? 'bg-white/20 text-sidebar-foreground shadow-lg backdrop-blur-sm'
          : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground'
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
      )}
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-transform duration-200 relative z-10",
        isActive && "scale-110"
      )} />
      <span className="font-medium truncate relative z-10">{item.label}</span>
      {isActive && (
        <Sparkles className="w-3 h-3 ml-auto opacity-70 animate-pulse relative z-10" />
      )}
    </NavLink>
  );
});

NavItem.displayName = 'NavItem';

const Sidebar = memo(function Sidebar({ onClose }: SidebarProps) {
  const { profile, role, logout, isLoading } = useAuth();
  const location = useLocation();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  const handleNavClick = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const items = useMemo(() => {
    if (!role) return [];
    return menuItems[role] || menuItems.outro;
  }, [role]);

  const userInitials = useMemo(() => {
    if (!profile?.nome) return '??';
    return profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }, [profile?.nome]);

  if (isLoading || !profile || !role) {
    return (
      <aside className="h-screen w-64 sidebar-gradient flex items-center justify-center">
        <div className="animate-pulse text-sidebar-foreground/50">Carregando...</div>
      </aside>
    );
  }

  return (
    <aside className="h-screen w-64 sidebar-gradient flex flex-col relative">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ThemedLogo className="w-10 h-10 rounded-xl ring-2 ring-white/20" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar-background" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sidebar-foreground text-lg tracking-tight">
                FrequênciaQR
              </h1>
              <span className="text-xs text-sidebar-foreground/60 font-medium">
                Sistema Escolar
              </span>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-sidebar-foreground hover:bg-white/10 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-sidebar-foreground font-bold text-sm shadow-inner">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {profile.nome}
            </p>
            <p className="text-xs text-sidebar-foreground/60 font-medium">
              {roleLabels[role] || role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto scrollbar-thin">
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
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Install PWA button */}
        {!isStandalone && (
          <NavLink
            to="/install"
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
              location.pathname === '/install'
                ? 'bg-white/20 text-sidebar-foreground'
                : 'text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground'
            )}
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium truncate">Instalar App</span>
          </NavLink>
        )}
        
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-sidebar-foreground/60 font-medium">Tema</span>
          <ThemeToggle />
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10 rounded-xl"
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
