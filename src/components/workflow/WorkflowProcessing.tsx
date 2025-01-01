import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface WorkflowProcessingProps {
  isProcessing: boolean;
  currentStage: string;
  outputs?: Array<{
    agent: string;
    outputs: Array<{
      content: string;
    }>;
  }>;
}

export const WorkflowProcessing = ({ isProcessing, currentStage, outputs }: WorkflowProcessingProps) => {
  return (
    <Card className="mt-4 bg-background/60 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Elaborazione Stage: {currentStage}
          {isProcessing && (
            <Badge variant="secondary" className="animate-pulse">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              In elaborazione...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {outputs?.map((output, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-primary">{output.agent}</h4>
                {output.outputs.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground"
                  >
                    {item.content}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};