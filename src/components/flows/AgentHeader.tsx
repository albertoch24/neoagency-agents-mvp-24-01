import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderProps {
  agentName: string;
  index: number;
  orderIndex: number;
  outputs?: { text: string }[];
  children?: React.ReactNode;
}

export const AgentHeader = ({ agentName, index, orderIndex, outputs, children }: AgentHeaderProps) => {
  console.log("AgentHeader props:", { agentName, index, orderIndex, outputs });
  
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-start gap-4">
        <User className="h-5 w-5 mt-1 text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Step {index + 1}
            </Badge>
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