import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  console.log("StageOutput received:", {
    output,
    stepId,
    hasContent: !!output?.content,
    outputType: output?.content?.outputs ? 'structured' : 'simple',
    stageId: output?.stage_id
  });

  if (!output?.content) {
    console.log("No content in output");
    return null;
  }

  // Handle structured content for specific step
  if (output.content.outputs && Array.isArray(output.content.outputs)) {
    const stepOutput = output.content.outputs.find(out => 
      out.stepId === stepId
    );

    if (!stepOutput) {
      console.log("No output found for step:", stepId);
      return null;
    }

    console.log("Found step output:", stepOutput);

    // Format the content for better readability
    const formattedContent = stepOutput.outputs?.map(out => {
      try {
        // Try to parse if it's a JSON string
        const parsed = typeof out.content === 'string' ? JSON.parse(out.content) : out.content;
        return parsed.perimetroContent || out.content;
      } catch {
        // If parsing fails, return the content as is
        return out.content;
      }
    }).filter(Boolean).join('\n\n');

    if (!formattedContent) {
      console.log("No formatted content available");
      return null;
    }

    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="bg-muted/30 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="text-lg font-semibold mb-4 text-primary">
              Output Strutturato - {stepOutput.agent}
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