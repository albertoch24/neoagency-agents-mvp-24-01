import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LogOut, List } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="w-full border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">SkillKeeper</h1>
          {user && (
            <div className="flex items-center gap-4">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>
                      <List className="mr-2" />
                      Projects
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="p-4 w-[200px]">
                        <NavigationMenuLink
                          className="block px-4 py-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => navigate("/agents")}
                        >
                          AI Agents
                        </NavigationMenuLink>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            AI Agent Management System
          </h2>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Create, manage, and orchestrate AI agents with customizable skills and sequential workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/agents")}
              className="text-lg"
            >
              Manage Agents
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;