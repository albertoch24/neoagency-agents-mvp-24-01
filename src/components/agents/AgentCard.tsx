import { Agent } from "@/types/agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export const AgentCard = ({ agent, onClick }: AgentCardProps) => {
  return (
    <Card className="card-hover-effect agent-card cursor-pointer" onClick={onClick}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {agent.name}
          <Badge variant="secondary">{agent.skills.length} skills</Badge>
        </CardTitle>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Updated {formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
};