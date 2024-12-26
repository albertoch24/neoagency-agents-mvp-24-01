import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
          <Card key={agent.id} className="hover:bg-accent transition-colors">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start p-0 h-auto"
                onClick={() => onAddAgent(agent.id)}
              >
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{agent.name}</div>
                    {agent.description && (
                      <p className="text-sm text-muted-foreground">
                        {agent.description}
                      </p>
                    )}
                  </div>
                  <Plus className="h-4 w-4 ml-auto mt-1" />
                </div>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};