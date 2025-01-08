import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { MarkdownContent } from "@/components/flows/MarkdownContent";

interface WorkflowOutputProps {
  briefId: string;
  stageId: string;
}

interface Output {
  content: string;
  type: string;
}

interface AgentOutput {
  agent: string;
  requirements?: string;
  outputs: Output[];
  stepId: string;
  orderIndex: number;
}

interface StageOutput {
  stage_name: string;
  flow_name: string;
  agent_count: number;
  outputs: AgentOutput[];
}

// Type guard to check if an object is a StageOutput
function isStageOutput(obj: any): obj is StageOutput {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'stage_name' in obj &&
    'flow_name' in obj &&
    'agent_count' in obj &&
    'outputs' in obj &&
    Array.isArray(obj.outputs)
  );
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  const { data: outputs } = useQuery({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      console.log("Fetching outputs for stage:", stageId);
      
      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", stageId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching outputs:", error);
        return [];
      }

      console.log("Found outputs:", data);
      return data;
    },
    enabled: !!briefId && !!stageId,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  });

  if (!outputs?.length) {
    return null;
  }

  return (
    <Card className="w-full bg-background shadow-lg">
      <CardContent className="p-8">
        <ScrollArea className="h-[600px] pr-6">
          <div className="space-y-12">
            {outputs.map((output) => {
              // Safely type check the content
              const content = output.content as unknown;
              if (!isStageOutput(content)) {
                console.error("Invalid stage output format:", content);
                return null;
              }
              
              console.log("Processing output content:", content);

              return (
                <div key={output.id} className="space-y-8">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {content.stage_name}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(output.created_at), "PPpp")}
                    </span>
                  </div>
                  
                  <div className="text-foreground">
                    {content.outputs?.map((agentOutput, index) => (
                      <div key={index} className="mt-8">
                        <div className="prose prose-sm max-w-none mb-8">
                          <div className="rounded-md bg-muted/30 p-6 backdrop-blur-sm">
                            <h4 className="text-lg font-semibold mb-4 text-primary">
                              {agentOutput.agent}
                              {agentOutput.requirements && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                  ({agentOutput.requirements})
                                </span>
                              )}
                            </h4>
                            {agentOutput.outputs?.map((output, outputIndex) => (
                              <div key={outputIndex} className="mb-8 last:mb-0">
                                {output.type === 'conversational' && (
                                  <MarkdownContent content={output.content} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};