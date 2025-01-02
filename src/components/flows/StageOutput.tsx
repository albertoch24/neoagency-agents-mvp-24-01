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
  const { data: stageSummary, isLoading, error } = useQuery({
    queryKey: ["stage-summary", output.stage_id],
    queryFn: async () => {
      if (!output.stage_id) return null;

      console.log("Fetching summary for stage:", output.stage_id);

      // First, check if we already have a summary in the database
      const { data: existingOutputs, error: fetchError } = await supabase
        .from('brief_outputs')
        .select('stage_summary')
        .eq('stage_id', output.stage_id)
        .not('stage_summary', 'is', null)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching existing summary:", fetchError);
        throw fetchError;
      }

      if (existingOutputs?.stage_summary) {
        console.log("Found existing summary");
        return existingOutputs.stage_summary;
      }

      console.log("No existing summary found, generating new one");

      // If no summary exists, generate one using our edge function
      const response = await fetch('/functions/v1/generate-stage-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          stageId: output.stage_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to generate summary:", errorData);
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      return data.summary;
    },
    enabled: !!output?.stage_id,
    retry: 1, // Only retry once to avoid too many attempts
  });

  if (!output?.content) {
    return null;
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Generating Stage Summary...</p>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    console.error("Error in StageOutput:", error);
    return null;
  }

  // Only show the summary if we have one
  if (!stageSummary) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">Stage Summary:</p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {stageSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};