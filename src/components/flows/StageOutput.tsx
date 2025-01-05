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
        outputs: Array<{
          content: string;
        }>;
      }>;
      [key: string]: any;
    };
    stage_id?: string;
    [key: string]: any;
  };
}

export const StageOutput = ({ output }: StageOutputProps) => {
  console.log("StageOutput received:", output); // Debug log

  if (!output?.content) {
    console.log("No content in output"); // Debug log
    return null;
  }

  // Handle both string and structured content
  const content = typeof output.content === 'string' 
    ? output.content 
    : JSON.stringify(output.content, null, 2);

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="bg-muted rounded-lg p-4">
          {output.content.response ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {output.content.response}
            </p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <MarkdownContent content={content} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};