import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <h1 className="mb-2 text-8xl font-display font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mb-8 text-muted-foreground max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </Button>
          <Button variant="gradient" asChild>
            <Link to="/dashboard" className="gap-2">
              <Home className="w-4 h-4" />
              Ir para o Painel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
