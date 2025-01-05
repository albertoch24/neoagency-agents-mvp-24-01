import React from 'react';
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderProps {
  agentName: string;
  index: number;
  orderIndex?: number;  // Add optional orderIndex prop
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ 
  agentName, 
  index,
  orderIndex  // Use orderIndex if provided, otherwise fallback to index + 1
}) => {
  // Use orderIndex if provided, otherwise use index + 1
  const stepNumber = orderIndex !== undefined ? orderIndex + 1 : index + 1;

  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b">
      <User className="h-5 w-5 text-agent" />
      <span className="font-semibold text-lg">
        {agentName || 'Unknown Agent'}
      </span>
      <Badge variant="outline" className="ml-auto">
        Step {stepNumber}
      </Badge>
    </div>
  );
};