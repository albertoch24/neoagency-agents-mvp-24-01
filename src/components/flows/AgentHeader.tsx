import React from 'react';
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AgentHeaderProps {
  agentName: string;
  index: number;
  orderIndex?: number;
  description?: string;
  children?: React.ReactNode;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ 
  agentName, 
  index,
  orderIndex,
  description,
  children
}) => {
  const stepNumber = orderIndex !== undefined ? orderIndex + 1 : index + 1;

  return (
    <div className="flex flex-col gap-3 mb-4 pb-2 border-b bg-[#9b87f5]/10 p-2 rounded-md">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="shrink-0">
          Step {stepNumber}
        </Badge>
        <div className="flex items-center gap-2 min-w-0">
          <User className="h-5 w-5 text-agent shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-lg truncate">
              {agentName || 'Unknown Agent'}
            </span>
          </div>
        </div>
      </div>
      <Accordion type="single" collapsible defaultValue="step-content">
        <AccordionItem value="step-content" className="border-none">
          <AccordionTrigger className="py-1">
            Step Details
          </AccordionTrigger>
          <AccordionContent>
            {description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Description:</h4>
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              </div>
            )}
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};