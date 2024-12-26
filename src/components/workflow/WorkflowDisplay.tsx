import { WorkflowStages, stages } from "@/components/workflow/WorkflowStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleList } from "@/components/workflow/RoleList";
import { OutputList } from "@/components/workflow/OutputList";
import { WorkflowConversation } from "@/components/workflow/WorkflowConversation";
import { WorkflowStage } from "@/types/workflow";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface WorkflowDisplayProps {
  currentStage: string;
  onStageSelect: (stage: WorkflowStage) => void;
  briefId?: string;
}

interface BriefOutputContent {
  agent_id: string;
  agent_name: string;
  response: string;
}

interface BriefOutput {
  id: string;
  brief_id: string;
  stage: string;
  content: BriefOutputContent;
  created_at: string;
  updated_at: string;
}

const WorkflowDisplay = ({ currentStage, onStageSelect, briefId }: WorkflowDisplayProps) => {
  // Fetch brief outputs for the current stage
  const { data: stageOutputs } = useQuery<BriefOutput[]>({
    queryKey: ["brief-outputs", briefId, currentStage],
    queryFn: async () => {
      if (!briefId) return [];

      const { data, error } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage", currentStage);

      if (error) {
        console.error("Error fetching outputs:", error);
        return [];
      }

      // Transform and validate the data to ensure content is properly typed
      return (data || []).map(output => {
        const typedContent = output.content as unknown as BriefOutputContent;
        
        // Validate that the content has the required properties
        if (!typedContent || typeof typedContent !== 'object' || 
            !('agent_id' in typedContent) || 
            !('agent_name' in typedContent) || 
            !('response' in typedContent)) {
          console.error('Invalid content structure:', output.content);
          return {
            ...output,
            content: {
              agent_id: 'unknown',
              agent_name: 'Unknown Agent',
              response: 'Error: Invalid output format'
            }
          };
        }

        return {
          ...output,
          content: typedContent
        };
      });
    },
    enabled: !!briefId,
  });

  useEffect(() => {
    const processStage = async () => {
      if (!briefId) return;

      try {
        toast.info(`Processing ${currentStage} stage...`);
        
        const { error } = await supabase.functions.invoke('process-workflow-stage', {
          body: { briefId, stageId: currentStage }
        });

        if (error) throw error;
        
        toast.success(`Stage ${currentStage} processed successfully!`);
      } catch (error) {
        console.error('Error processing stage:', error);
        toast.error('Failed to process workflow stage');
      }
    };

    processStage();
  }, [currentStage, briefId]);

  return (
    <div className="space-y-8 px-4">
      <WorkflowStages currentStage={currentStage} onStageSelect={onStageSelect} />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleList
              roles={stages.find((stage) => stage.id === currentStage)?.roles || []}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Stage Outputs</CardTitle>
        </CardHeader>
        <CardContent>
          {stageOutputs && stageOutputs.length > 0 ? (
            <div className="space-y-6">
              {stageOutputs.map((output) => (
                <div key={output.id} className="space-y-3">
                  <h4 className="text-lg font-semibold text-primary">
                    {output.content.agent_name}
                  </h4>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {output.content.response.split('\n').map((paragraph, index) => (
                      paragraph.trim() && (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Processing stage outputs...</p>
          )}
        </CardContent>
      </Card>

      {briefId && (
        <WorkflowConversation
          briefId={briefId}
          currentStage={currentStage}
        />
      )}
    </div>
  );
};

export default WorkflowDisplay;