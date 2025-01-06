import React from 'react';
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderProps {
  agentName: string;
  index: number;
  orderIndex?: number;
  description?: string;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ 
  agentName, 
  index,
  orderIndex,
  description
}) => {
  const stepNumber = orderIndex !== undefined ? orderIndex + 1 : index + 1;

  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b bg-[#9b87f5]/10 p-2 rounded-md">
      <Badge variant="outline" className="shrink-0">
        Step {stepNumber}
      </Badge>
      <div className="flex items-center gap-2 min-w-0">
        <User className="h-5 w-5 text-agent shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-lg truncate">
            {agentName || 'Unknown Agent'}
          </span>
          {description && (
            <span className="text-sm text-muted-foreground truncate">
              {description}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};