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
  console.log("🔍 Validating output structure:", {
    rawObject: obj,
    type: typeof obj,
    keys: obj ? Object.keys(obj) : 'null'
  });
  
  const isValid = (
    typeof obj === 'object' &&
    obj !== null &&
    'stage_name' in obj &&
    'flow_name' in obj &&
    'agent_count' in obj &&
    'outputs' in obj &&
    Array.isArray(obj.outputs)
  );
  
  console.log("✓ Is valid stage output?", isValid);
  if (!isValid) {
    console.log("❌ Missing required fields:", {
      hasStageNameField: 'stage_name' in obj,
      hasFlowNameField: 'flow_name' in obj,
      hasAgentCountField: 'agent_count' in obj,
      hasOutputsField: 'outputs' in obj,
      outputsIsArray: Array.isArray(obj?.outputs)
    });
  }
  return isValid;
}

export const WorkflowOutput = ({ briefId, stageId }: WorkflowOutputProps) => {
  console.log("🚀 WorkflowOutput rendered with:", { briefId, stageId });

  // Validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const { data: outputs, error } = useQuery({
    queryKey: ["brief-outputs", briefId, stageId],
    queryFn: async () => {
      console.log("📡 Fetching outputs for:", { briefId, stageId });
      
      if (!briefId || !stageId) {
        console.log("❌ Missing briefId or stageId");
        return [];
      }

      // Only proceed with the query if stageId is a valid UUID
      if (!isValidUUID(stageId)) {
        console.log("Invalid stage ID format:", stageId);
        return [];
      }

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", stageId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("❌ Error fetching outputs:", error);
        toast.error("Failed to fetch outputs");
        return [];
      }

      console.log("✨ Found outputs:", {
        count: data?.length,
        outputs: data?.map(output => ({
          id: output.id,
          briefId: output.brief_id,
          stageId: output.stage_id,
          contentType: typeof output.content,
          contentKeys: output.content ? Object.keys(output.content) : [],
          rawContent: output.content
        }))
      });
      
      return data;
    },
    enabled: !!briefId && !!stageId,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  });

  console.log("📊 Current outputs state:", {
    hasOutputs: !!outputs?.length,
    outputCount: outputs?.length,
    firstOutput: outputs?.[0]
  });

  if (error) {
    console.error("❌ Query error:", error);
    return (
      <div className="p-4 text-red-500">
        Error loading outputs. Please try again.
      </div>
    );
  }

  if (!outputs?.length) {
    console.log("ℹ️ No outputs found");
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

  // We only show the latest output
  const latestOutput = outputs[0];
  const content = typeof latestOutput.content === 'string' 
    ? JSON.parse(latestOutput.content) 
    : latestOutput.content;

  console.log("Processing latest output:", {
    outputId: latestOutput.id,
    content: content,
    isValid: isStageOutput(content)
  });

  return (
    <Card className="w-full bg-background shadow-lg">
      <CardContent className="p-8">
        <ScrollArea className="h-[600px] pr-6">
          <div className="space-y-12">
            {latestOutput && (
              <div key={latestOutput.id} className="space-y-8">
                <OutputHeader 
                  stageName={content.stage_name}
                  createdAt={latestOutput.created_at}
                />
                
                <div className="text-foreground">
                  {isStageOutput(content) && 
                    content.outputs?.map((agentOutput, index) => (
                      <AgentOutput
                        key={`${latestOutput.id}-${index}`}
                        agent={agentOutput.agent}
                        outputs={agentOutput.outputs}
                        orderIndex={agentOutput.orderIndex}
                        requirements={agentOutput.requirements}
                        index={index}
                      />
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};