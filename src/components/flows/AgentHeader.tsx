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
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-start gap-4">
        <User className="h-5 w-5 mt-1 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1 rounded-full font-medium"
            >
              Step {index + 1}
            </Badge>
            {description && (
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
            )}
            <h4 className="font-medium">{agentName}</h4>
          </div>
          {outputs && outputs.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                {outputs.map((o, i) => (
                  <span key={i} className="block">• {o.text}</span>
                ))}
              </p>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};