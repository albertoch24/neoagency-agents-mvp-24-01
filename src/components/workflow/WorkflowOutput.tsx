import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkflowOutputProps {
  briefId: string;
  stageId: string;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  const { data: outputs } = useQuery({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", stageId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!briefId && !!stageId,
  });

  if (!outputs?.length) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stage Output</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {outputs.map((output) => (
            <div key={output.id} className="space-y-3">
              <h4 className="text-lg font-semibold text-primary">
                {output.content.stage_name || 'Stage Output'}
              </h4>
              <div className="text-muted-foreground">
                <p className="mb-2">Flow: {output.content.flow_name || 'No flow specified'}</p>
                <p className="mb-2">Agents involved: {output.content.agent_count || 0}</p>
                {output.content.response && (
                  <div className="whitespace-pre-wrap mt-4">
                    {output.content.response}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};