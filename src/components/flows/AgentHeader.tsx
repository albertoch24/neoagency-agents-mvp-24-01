import React from 'react';
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentHeaderProps {
  agentName: string;
  index: number;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ agentName, index }) => {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b">
      <User className="h-5 w-5 text-agent" />
      <span className="font-semibold text-lg">
        {agentName || 'Unknown Agent'}
      </span>
      <Badge variant="outline" className="ml-auto">
        Step {index + 1}
      </Badge>
    </div>
  );
};