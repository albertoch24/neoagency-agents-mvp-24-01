import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ListChecks } from "lucide-react";

interface Flow {
  id: string;
  name: string;
  description: string | null;
}

interface FlowListProps {
  flows: Flow[];
  selectedFlow: Flow | null;
  onSelectFlow: (flow: Flow) => void;
  onShowHistory: (flow: Flow) => void;
}

export const FlowList = ({ 
  flows, 
  selectedFlow, 
  onSelectFlow, 
  onShowHistory 
}: FlowListProps) => {
  return (
    <div className="grid gap-4">
      {flows.map((flow) => (
        <Card 
          key={flow.id} 
          className={`relative cursor-pointer transition-all hover:shadow-md ${
            selectedFlow?.id === flow.id ? 'border-primary' : ''
          }`}
          onClick={() => onSelectFlow(flow)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                {flow.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowHistory(flow);
                }}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
            {flow.description && (
              <p className="text-sm text-muted-foreground">{flow.description}</p>
            )}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};