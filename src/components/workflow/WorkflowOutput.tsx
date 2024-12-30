import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BriefOutput } from "@/types/workflow";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface WorkflowOutputProps {
  briefId: string;
  stageId: string;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  // Query to fetch outputs with no caching to ensure fresh data
  const { data: outputs } = useQuery({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      console.log("Fetching outputs for stage:", stageId);
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", stageId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching outputs:", error);
        return [];
      }

      console.log("Found outputs:", data);
      return data as BriefOutput[];
    },
    enabled: !!briefId && !!stageId,
    staleTime: 0, // Disable stale time to always fetch fresh data
    gcTime: 0, // Disable caching
    refetchInterval: 5000, // Refetch every 5 seconds to ensure we have the latest data
  });

  if (!outputs?.length) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          {outputs.map((output) => (
            <div key={output.id} className="space-y-6">
              <h4 className="text-lg font-semibold text-primary">
                {output.content.stage_name || 'Stage Output'}
              </h4>
              <div className="text-muted-foreground">
                {output.content.outputs?.map((agentOutput: any, index: number) => (
                  <div key={index} className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={`agent-${index}`}>
                        <AccordionTrigger className="text-lg font-medium">
                          {agentOutput.agent}
                        </AccordionTrigger>
                        <AccordionContent>
                          {agentOutput.outputs?.map((outputItem: any, outputIndex: number) => (
                            <div key={outputIndex} className="ml-4 p-4 bg-muted rounded-lg mt-2">
                              <h6 className="font-semibold mb-2">{outputItem.text}</h6>
                              {outputItem.content && (
                                <div className="text-sm mt-2">
                                  <p className="whitespace-pre-wrap">{outputItem.content}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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