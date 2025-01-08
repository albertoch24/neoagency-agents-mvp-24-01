import { Card, CardContent } from "@/components/ui/card";
import { MarkdownContent } from "../flows/MarkdownContent";

interface AgentOutputProps {
  agent: string;
  outputs: Array<{
    content: string;
    type: string;
  }>;
  orderIndex: number;
  requirements?: string;
  index: number;
}

export const AgentOutput = ({
  agent,
  outputs,
  requirements,
  index
}: AgentOutputProps) => {
  console.log("Rendering agent output:", { agent, outputs, requirements });

  return (
    <Card className="mb-6 last:mb-0">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            {agent}
          </h3>
          
          {requirements && (
            <div className="bg-muted/30 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="text-sm font-medium mb-2">Requirements:</h4>
              <div className="prose prose-sm max-w-none">
                <MarkdownContent content={requirements} />
              </div>
            </div>
          )}

          <div className="space-y-4">
            {outputs?.map((output, outputIndex) => (
              <div key={outputIndex} className="prose prose-sm max-w-none">
                <MarkdownContent content={output.content} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};