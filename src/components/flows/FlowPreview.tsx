import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FlowStep {
  id: string;
  agent_id: string;
  order_index: number;
  outputs?: string[];
  requirements?: string;
  agents: {
    name: string;
    description: string;
  };
}

interface FlowPreviewProps {
  flowSteps?: FlowStep[];
}

export const FlowPreview = ({ flowSteps }: FlowPreviewProps) => {
  if (!flowSteps?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {flowSteps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-2">
          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <User className="h-5 w-5 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Step {index + 1}
                    </Badge>
                    <h4 className="font-medium">{step.agents.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.agents.description}
                  </p>
                  {step.outputs && step.outputs.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Required Outputs:</h5>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {step.outputs.map((output, i) => (
                          <li key={i} className="text-muted-foreground">
                            {output}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {step.requirements && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Requirements:</h5>
                      <p className="text-sm text-muted-foreground">
                        {step.requirements}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {index < flowSteps.length - 1 && (
            <ArrowRight className="h-6 w-6 text-muted-foreground mt-4" />
          )}
        </div>
      ))}
    </div>
  );
};