import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkflowStages } from "./WorkflowStages";
import { WorkflowConversation } from "./WorkflowConversation";
import { WorkflowActions } from "./WorkflowActions";
import { WorkflowProgress } from "./WorkflowProgress";

interface WorkflowDisplayProps {
  briefId?: string;
  currentStage: string;
  onStageSelect: (stage: any) => void;
}

export const WorkflowDisplay = ({
  briefId,
  currentStage,
  onStageSelect,
}: WorkflowDisplayProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Query to fetch stages with their associated flows and steps
  const { data: stages } = useQuery({
    queryKey: ["stages", briefId],
    queryFn: async () => {
      console.log("Fetching stages for brief:", briefId);
      
      const { data, error } = await supabase
        .from("stages")
        .select(`
          *,
          flows (
            id,
            name,
            flow_steps (
              id,
              agent_id,
              order_index,
              requirements,
              agents (
                id,
                name,
                description
              )
            )
          )
        `)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching stages:", error);
        throw error;
      }

      console.log("Fetched stages with flows:", data);
      return data;
    },
  });

  const processNextStage = async (nextStage: any) => {
    if (!briefId || isProcessing) return;

    setIsProcessing(true);
    try {
      console.log("Processing stage:", {
        stageId: nextStage.id,
        stageName: nextStage.name,
        flows: nextStage.flows
      });

      // Get the flow and flow steps for the next stage
      const flow = nextStage.flows?.[0];
      if (!flow) {
        console.error("No flow found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name
        });
        toast.error(`No workflow found for stage "${nextStage.name}". Please configure a workflow for this stage first.`);
        throw new Error(`No flow found for stage "${nextStage.name}"`);
      }

      const flowSteps = flow.flow_steps || [];
      if (flowSteps.length === 0) {
        console.error("No flow steps found for stage:", {
          stageId: nextStage.id,
          stageName: nextStage.name,
          flowId: flow.id
        });
        toast.error(`No workflow steps found for stage "${nextStage.name}". Please add steps to the workflow.`);
        throw new Error("No flow steps found for this stage");
      }

      // Sort flow steps by order_index
      const sortedFlowSteps = [...flowSteps].sort((a, b) => a.order_index - b.order_index);

      console.log("Processing stage with flow:", {
        briefId,
        stageId: nextStage.id,
        flowId: flow.id,
        flowSteps: sortedFlowSteps,
        flowStepsCount: sortedFlowSteps.length
      });

      const { error: workflowError } = await supabase.functions.invoke(
        "process-workflow-stage",
        {
          body: {
            briefId, 
            stageId: nextStage.id,
            flowId: flow.id,
            flowSteps: sortedFlowSteps
          },
        }
      );

      if (workflowError) {
        console.error("Workflow processing error:", workflowError);
        throw workflowError;
      }

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["workflow-conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["brief-outputs"] });
      await queryClient.invalidateQueries({ queryKey: ["briefs"] });

      // Update URL params to show outputs for the next stage
      const newParams = new URLSearchParams(searchParams);
      newParams.set("stage", nextStage.id);
      newParams.set("showOutputs", "true");
      setSearchParams(newParams);

      // Update the current stage in the parent component
      onStageSelect(nextStage);
      
      toast.success("Stage processed successfully");
    } catch (error: any) {
      console.error("Error processing next stage:", error);
      toast.error(error.message || "Failed to process stage");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStageSelect = async (stage: any) => {
    if (isProcessing) return;

    const currentIndex = stages?.findIndex((s) => s.id === currentStage) ?? -1;
    const selectedIndex = stages?.findIndex((s) => s.id === stage.id) ?? -1;

    // If selecting the next stage in sequence, process it
    if (selectedIndex === currentIndex + 1) {
      await processNextStage(stage);
    } else {
      // Otherwise just update the UI to show the selected stage
      const newParams = new URLSearchParams(searchParams);
      newParams.set("stage", stage.id);
      setSearchParams(newParams);
      onStageSelect(stage);
    }
  };

  if (!stages?.length) {
    return null;
  }

  return (
    <div className="space-y-8">
      <WorkflowProgress
        stages={stages}
        currentStage={currentStage}
      />
      
      <WorkflowStages
        currentStage={currentStage}
        onStageSelect={handleStageSelect}
        disabled={isProcessing}
      />

      {briefId && currentStage && (
        <>
          <WorkflowConversation
            briefId={briefId}
            currentStage={currentStage}
          />
          
          <WorkflowActions
            stages={stages}
            currentStage={currentStage}
            onNextStage={() => {
              const currentIndex = stages.findIndex(s => s.id === currentStage);
              const nextStage = stages[currentIndex + 1];
              if (nextStage) {
                processNextStage(nextStage);
              }
            }}
            disabled={isProcessing}
          />
        </>
      )}
    </div>
  );
};