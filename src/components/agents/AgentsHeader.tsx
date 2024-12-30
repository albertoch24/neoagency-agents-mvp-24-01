import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";

interface AgentsHeaderProps {
  onGoHome: () => void;
  onCreateAgent: () => void;
}

export const AgentsHeader = ({ onGoHome, onCreateAgent }: AgentsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <p className="text-muted-foreground">
          Manage your AI agents and their capabilities
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onGoHome}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go to Brief
        </Button>
        <Button 
          onClick={onCreateAgent}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>
    </div>
  );
};