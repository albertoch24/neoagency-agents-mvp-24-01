import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { OutputHeader } from "./OutputHeader";
import { AgentOutput } from "./AgentOutput";

interface WorkflowOutputProps {
  briefId: string;
  stageId: string;
}

interface AgentOutput {
  agent: string;
  requirements?: string;
  outputs: Array<{
    content: string;
    type: string;
  }>;
  stepId: string;
  orderIndex: number;
}

interface StageOutput {
  stage_name: string;
  flow_name: string;
  agent_count: number;
  outputs: AgentOutput[];
}

function isStageOutput(obj: any): obj is StageOutput {
  console.log("Validating output structure:", obj);
  const isValid = (
    typeof obj === 'object' &&
    obj !== null &&
    'stage_name' in obj &&
    'flow_name' in obj &&
    'agent_count' in obj &&
    'outputs' in obj &&
    Array.isArray(obj.outputs)
  );
  console.log("Is valid stage output?", isValid);
  return isValid;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  console.log("WorkflowOutput rendered with:", { briefId, stageId });

  const { data: outputs, error } = useQuery({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      console.log("Fetching outputs for:", { briefId, stageId });
      
      if (!briefId || !stageId) {
        console.log("Missing briefId or stageId");
        return [];
      }

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", stageId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching outputs:", error);
        toast.error("Failed to fetch outputs");
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

  console.log("Current outputs state:", outputs);

  if (error) {
    console.error("Query error:", error);
    return (
      <div className="p-4 text-red-500">
        Error loading outputs. Please try again.
      </div>
    );
  }

  if (!outputs?.length) {
    console.log("No outputs found");
    return (
      <Card className="w-full bg-background shadow-lg">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No outputs available yet. Processing may be in progress...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background shadow-lg">
      <CardContent className="p-8">
        <ScrollArea className="h-[600px] pr-6">
          <div className="space-y-12">
            {outputs.map((output) => {
              console.log("Processing output:", output);
              const content = output.content;
              
              if (!isStageOutput(content)) {
                console.error("Invalid stage output format:", content);
                return null;
              }
              
              return (
                <div key={output.id} className="space-y-8">
                  <OutputHeader 
                    stageName={content.stage_name}
                    createdAt={output.created_at}
                  />
                  
                  <div className="text-foreground">
                    {content.outputs?.map((agentOutput, index) => (
                      <AgentOutput
                        key={index}
                        agent={agentOutput.agent}
                        outputs={agentOutput.outputs}
                        orderIndex={agentOutput.orderIndex}
                        requirements={agentOutput.requirements}
                        index={index}
                      />
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