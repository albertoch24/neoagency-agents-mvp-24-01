import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  if (!output?.content) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {output.content.response}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};