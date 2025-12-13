export type UserRole = 'professor' | 'diretor' | 'administrador';

export interface User {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  cargo: UserRole;
  unidade?: string;
  foto?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
