import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "./Logo";
import AdminNavigation from "./AdminNavigation";
import { useQuery } from "@tanstack/react-query";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Fetch profile data to check admin status
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

  // Debug logs
  console.log('User:', user?.id);
  console.log('Profile:', profile);
  console.log('Is admin?', profile?.is_admin);

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
          
          {/* Admin Navigation Menu - now checking profile.is_admin */}
          {profile?.is_admin && <AdminNavigation />}
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