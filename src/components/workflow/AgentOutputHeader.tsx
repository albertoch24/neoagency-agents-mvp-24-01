import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentOutputHeaderProps {
  agent: string;
  orderIndex: number;
  requirements?: string;
}

export const AgentOutputHeader = ({ agent, orderIndex, requirements }: AgentOutputHeaderProps) => (
  <div className="bg-agent p-6 rounded-lg border border-agent-border shadow-sm">
    <div className="flex items-start gap-4">
      <div className="bg-primary/10 p-2 rounded-full">
        <User className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <Badge 
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-4 py-2 rounded-full font-bold flex flex-col items-center min-w-[60px]"
            >
              <span>Step</span>
              <span>{orderIndex + 1}</span>
            </Badge>
            {requirements && (
              <div className="w-px h-full bg-primary/20" />
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <h4 className="text-lg font-bold text-agent-foreground">{agent}</h4>
            {requirements && (
              <div className="pl-2 border-l-2 border-primary/20 mt-1">
                <span className="text-sm text-muted-foreground">
                  {requirements}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);