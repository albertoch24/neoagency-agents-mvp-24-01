import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Users, GitBranch, Layers, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleHomeClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout effettuato con successo");
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Errore durante il logout");
    }
  };

  // Debug log to check user metadata
  console.log('User metadata:', user?.user_metadata);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleHomeClick}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            
            {/* Admin Navigation Menu */}
            {user?.user_metadata?.is_admin && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      onClick={() => navigate('/agents')}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Agents
                      </div>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      onClick={() => navigate('/flows')}
                    >
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Flows
                      </div>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      onClick={() => navigate('/stages')}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Stages
                      </div>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;