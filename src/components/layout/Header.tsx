import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "./Logo";
import AdminNavigation from "./AdminNavigation";

const Header = () => {
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
      toast.success("Successfully logged out");
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Error during logout");
    }
  };

  // Debug log to check user metadata
  console.log('User metadata:', user?.user_metadata);
  console.log('Is admin?', user?.user_metadata?.is_admin);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <Button
            variant="ghost"
            onClick={handleHomeClick}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          
          {/* Admin Navigation Menu */}
          {user?.user_metadata?.is_admin && <AdminNavigation />}
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
  );
};

export default Header;