import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderProps {
  agentName: string;
  index: number;
  orderIndex: number;
  outputs?: { text: string }[];
  description?: string;
  children?: React.ReactNode;
}

export const AgentHeader = ({ agentName, index, orderIndex, outputs, description, children }: AgentHeaderProps) => {
  console.log("AgentHeader props:", { agentName, index, orderIndex, outputs, description });
  
  return (
    <div className="flex flex-col gap-4 w-full bg-agent p-6 rounded-lg border border-agent-border shadow-sm">
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
                <span>{index + 1}</span>
              </Badge>
              {description && (
                <div className="w-px h-full bg-primary/20" />
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <h4 className="text-lg font-bold text-agent-foreground">{agentName}</h4>
              {description && (
                <div className="pl-2 border-l-2 border-primary/20 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                </div>
              )}
            </div>
          </div>
          {outputs && outputs.length > 0 && (
            <div className="mt-4 space-y-2">
              {outputs.map((o, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-agent-foreground/80">
                  <span className="mt-1">•</span>
                  <span>{o.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};