import { Card, CardContent } from "@/components/ui/card";
import { MarkdownContent } from "./MarkdownContent";

interface StageOutputProps {
  output: {
    created_at?: string;
    content: {
      response?: string;
      outputs?: Array<{
        agent: string;
        stepId?: string;
        outputs: Array<{
          content: string;
          type?: string;
        }>;
        orderIndex?: number;
        requirements?: string;
      }>;
      [key: string]: any;
    };
    stage_id?: string;
    [key: string]: any;
  };
  stepId?: string;
}

export const StageOutput = ({ output, stepId }: StageOutputProps) => {
  console.log("🔄 StageOutput processing:", {
    hasOutput: !!output,
    outputContent: output?.content,
    stepId,
    timestamp: new Date().toISOString()
  });

  if (!output?.content) {
    console.log("❌ No content in output for stage processing");
    return null;
  }

  // Handle both array and object formats for outputs
  const outputs = output.content.outputs || [];
  console.log("🔍 Processing stage outputs:", {
    outputsCount: outputs.length,
    stepId,
    outputs
  });

  const stepOutput = outputs.find(out => out.stepId === stepId);
  console.log("✅ Found step output:", {
    hasStepOutput: !!stepOutput,
    stepId,
    agentName: stepOutput?.agent
  });

  if (!stepOutput) {
    console.log("⚠️ No output found for step:", {
      stepId,
      availableStepIds: outputs.map(o => o.stepId)
    });
    return null;
  }

  // Combine all outputs content with proper formatting
  const formattedContent = stepOutput.outputs
    ?.map(out => out.content)
    .filter(Boolean)
    .join('\n\n');

  if (!formattedContent) {
    console.log("❌ No formatted content available for output");
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="bg-muted/30 rounded-lg p-6 backdrop-blur-sm">
          <h4 className="text-lg font-semibold mb-4 text-primary">
            Output - {stepOutput.agent}
          </h4>
          <div className="prose prose-sm max-w-none">
            <MarkdownContent content={formattedContent} />
          </div>
          {stepOutput.requirements && (
            <div className="mt-4 pt-4 border-t border-border">
              <h5 className="text-sm font-medium mb-2">Requirements:</h5>
              <p className="text-sm text-muted-foreground">{stepOutput.requirements}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};