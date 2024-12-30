import { Agent } from "@/types/agent";
import { Card, CardContent } from "@/components/ui/card";
import { AgentCard } from "./AgentCard";

interface AgentsListProps {
  agents: Agent[] | undefined;
  onEditAgent: (agent: Agent) => void;
  isLoading: boolean;
}

export const AgentsList = ({ agents, onEditAgent, isLoading }: AgentsListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-[500px] animate-pulse">
            <CardContent>
              <div className="h-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!agents?.length) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <p className="text-muted-foreground text-center">
            No agents found. Create your first AI agent to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <AgentCard 
          key={agent.id} 
          agent={agent} 
          onClick={() => onEditAgent(agent)}
        />
      ))}
    </div>
  );
};