import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string | null;
}

interface AgentListProps {
  agents?: Agent[];
  onAddAgent: (agentId: string) => void;
}

export const AgentList = ({ agents, onAddAgent }: AgentListProps) => {
  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2">
        {agents?.map((agent) => (
          <Button
            key={agent.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onAddAgent(agent.id)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {agent.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};