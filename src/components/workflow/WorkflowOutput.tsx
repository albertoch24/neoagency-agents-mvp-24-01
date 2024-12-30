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
      console.log("Fetching stage with name:", stageId);
      const { data, error } = await supabase
        .from("stages")
        .select("id")
        .eq("name", stageId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching stage:", error);
        return null;
      }

      console.log("Found stage:", data);
      return data;
    },
    enabled: !!stageId,
  });

  // Then query the outputs using the stage UUID
  const { data: outputs } = useQuery({
    queryKey: ["brief-outputs", briefId, stage?.id],
    queryFn: async () => {
      if (!stage?.id) {
        console.log("No stage found, skipping outputs query");
        return [];
      }

      console.log("Fetching outputs for stage:", stage.id);
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

      console.log("Found outputs:", data);
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
                {output.content.outputs?.map((agentOutput: any, index: number) => (
                  <div key={index} className="mt-6 space-y-4">
                    <h5 className="font-medium text-lg">{agentOutput.agent}</h5>
                    {agentOutput.outputs?.map((outputItem: any, outputIndex: number) => (
                      <div key={outputIndex} className="ml-4 p-4 bg-muted rounded-lg">
                        <h6 className="font-semibold mb-2">{outputItem.text}</h6>
                        {outputItem.content && (
                          <p className="text-sm mt-2">{outputItem.content}</p>
                        )}
                      </div>
                    ))}
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