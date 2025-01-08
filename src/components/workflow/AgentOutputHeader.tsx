import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentOutputHeaderProps {
  agent: string;
  orderIndex: number;
  requirements?: string;
}

export const AgentOutputHeader = ({ agent, orderIndex, requirements }: AgentOutputHeaderProps) => (
  <div className="bg-agent p-6 rounded-lg border border-agent-border shadow-sm mb-4">
    <div className="flex items-start gap-4">
      <div className="bg-primary/10 p-2 rounded-full">
        <User className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <Badge 
            variant="secondary"
            className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-2 rounded-full font-bold flex flex-col items-center min-w-[60px]"
          >
            <span>Step</span>
            <span>{orderIndex + 1}</span>
          </Badge>
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-bold text-agent-foreground">
              {agent}
            </h4>
            {requirements && (
              <span className="text-sm text-muted-foreground">
                {requirements}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);