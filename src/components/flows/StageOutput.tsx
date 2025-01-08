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
        }>;
      }>;
      [key: string]: any;
    };
    stage_id?: string;
    [key: string]: any;
  };
  stepId?: string;
}

export const StageOutput = ({ output, stepId }: StageOutputProps) => {
  console.log("StageOutput received:", output, "for step:", stepId);

  if (!output?.content) {
    console.log("No content in output");
    return null;
  }

  if (output.content.outputs && Array.isArray(output.content.outputs)) {
    const stepOutput = output.content.outputs.find(out => 
      out.stepId === stepId
    );

    if (!stepOutput) {
      console.log("No output found for step:", stepId);
      return null;
    }

    const formattedContent = stepOutput.outputs?.map(out => out.content).join('\n\n');

    if (!formattedContent) {
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};