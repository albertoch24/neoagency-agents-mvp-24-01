import { Users, GitBranch, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const AdminNavigation = () => {
  const navigate = useNavigate();

  return (
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
  );
};

export default AdminNavigation;