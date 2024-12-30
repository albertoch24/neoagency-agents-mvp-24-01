import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BriefOutput } from "@/types/workflow";

interface WorkflowOutputProps {
  briefId: string;
  stageId: string;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  // First query to get the stage UUID
  const { data: stage } = useQuery({
    queryKey: ["stage", stageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("id")
        .eq("name", stageId)
        .single();

      if (error) {
        console.error("Error fetching stage:", error);
        return null;
      }

      return data;
    },
    enabled: !!stageId,
  });

  // Then query the outputs using the stage UUID
  const { data: outputs } = useQuery({
    queryKey: ["brief-outputs", briefId, stage?.id],
    queryFn: async () => {
      if (!stage?.id) return [];

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", stage.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching outputs:", error);
        return [];
      }

      return data as BriefOutput[];
    },
    enabled: !!briefId && !!stage?.id,
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
                {output.content.outputs?.map((agentOutput: any, index: number) => (
                  <div key={index} className="mt-4 space-y-2">
                    <h5 className="font-medium">{agentOutput.agent}</h5>
                    {agentOutput.outputs?.map((output: any, outputIndex: number) => (
                      <div key={outputIndex} className="ml-4">
                        <h6 className="font-semibold text-primary">{output.text}</h6>
                      </div>
                    ))}
                    {agentOutput.requirements && (
                      <p className="ml-4 text-sm">
                        Requirements: {agentOutput.requirements}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};