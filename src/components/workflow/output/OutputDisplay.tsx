import { Card, CardContent } from "@/components/ui/card";
import { BriefOutput, Output } from "@/types/workflow";

interface OutputDisplayProps {
  output: BriefOutput;
}

export const OutputDisplay = ({ output }: OutputDisplayProps) => {
  const { content } = output;

  if (!content || !content.outputs) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {content.outputs.map((agentOutput, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-semibold text-lg">{agentOutput.agent}</h3>
            {agentOutput.requirements && (
              <p className="text-sm text-muted-foreground">{agentOutput.requirements}</p>
            )}
            <div className="space-y-1">
              {agentOutput.outputs.map((output, outputIndex) => (
                <div key={outputIndex} className="text-sm">
                  {output.content}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};