import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { AgentList } from "./AgentList";

interface FlowBuilderSidebarProps {
  agents: any[];
  onAddAgent: (agentId: string) => Promise<void>;
}

export const FlowBuilderSidebar = ({ agents, onAddAgent }: FlowBuilderSidebarProps) => {
  return (
    <Card className="col-span-1">
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