import { WorkflowStages, stages } from "@/components/workflow/WorkflowStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleList } from "@/components/workflow/RoleList";
import { OutputList } from "@/components/workflow/OutputList";
import { WorkflowConversation } from "@/components/workflow/WorkflowConversation";
import { WorkflowStage } from "@/types/workflow";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
  const queryClient = useQueryClient();

  // Fetch brief outputs for the current stage
  const { data: stageOutputs } = useQuery({
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

      return (data || []).map(output => {
        const typedContent = output.content as unknown as BriefOutputContent;
        
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

  // Fetch current brief to check status
  const { data: brief } = useQuery({
    queryKey: ["brief", briefId],
    queryFn: async () => {
      if (!briefId) return null;
      
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("id", briefId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!briefId,
  });

  const handleNextStage = async () => {
    if (!briefId || !brief) return;

    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];
    
    try {
      const { error: updateError } = await supabase
        .from("briefs")
        .update({ 
          current_stage: nextStage.id,
          status: nextStage.id === stages[stages.length - 1].id ? 'completed' : 'in_progress' 
        })
        .eq("id", briefId);

      if (updateError) throw updateError;

      toast.success(`Moving to ${nextStage.name} stage`);
      onStageSelect(nextStage);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
      queryClient.invalidateQueries({ queryKey: ["brief-outputs", briefId] });
    } catch (error) {
      console.error("Error updating stage:", error);
      toast.error("Failed to move to next stage");
    }
  };

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

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  const isLastStage = currentStageIndex === stages.length - 1;
  const hasOutputs = stageOutputs && stageOutputs.length > 0;

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stage Outputs</CardTitle>
          {hasOutputs && !isLastStage && (
            <Button 
              onClick={handleNextStage}
              className="flex items-center gap-2"
            >
              Next Stage
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
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