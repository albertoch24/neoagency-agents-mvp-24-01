import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { AgentList } from "./AgentList";
import { cn } from "@/lib/utils";

interface FlowBuilderSidebarProps {
  agents: any[];
  onAddAgent: (agentId: string) => Promise<void>;
  className?: string;
}

export const FlowBuilderSidebar = ({ agents, onAddAgent, className }: FlowBuilderSidebarProps) => {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="h-4 w-4" />
          <h3 className="font-semibold">Available Agents</h3>
        </div>
        <AgentList agents={agents} onAddAgent={onAddAgent} />
      </CardContent>
    </Card>
  );
};