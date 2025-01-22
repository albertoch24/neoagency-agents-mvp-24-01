import { Button } from "@/components/ui/button";
import { Stage } from "@/types/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WorkflowDisplayActionsProps {
  stages: Stage[];
  currentStage: string;
  onNextStage: (feedbackId: string | null) => void;
  isProcessing?: boolean;
  briefId?: string;
}

export const WorkflowDisplayActions = ({
  stages,
  currentStage,
  onNextStage,
  isProcessing,
  briefId
}: WorkflowDisplayActionsProps) => {
  const [currentStageProcessed, setCurrentStageProcessed] = useState(false);
  const [previousStageProcessed, setPreviousStageProcessed] = useState(false);

  // Verifica lo stato dello stage corrente
  useEffect(() => {
    const checkCurrentStageStatus = async () => {
      if (!currentStage || !briefId) return;

      try {
        console.log("🔍 Checking current stage outputs:", {
          briefId,
          stageId: currentStage,
          timestamp: new Date().toISOString()
        });

        // Verifica brief_outputs
        const { data: outputs, error: outputError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage_id', currentStage)
          .eq('brief_id', briefId);

        if (outputError) {
          console.error("Error checking brief outputs:", outputError);
          return;
        }

        // Verifica workflow_conversations
        const { data: conversations, error: convError } = await supabase
          .from('workflow_conversations')
          .select('*')
          .eq('stage_id', currentStage)
          .eq('brief_id', briefId);

        if (convError) {
          console.error("Error checking workflow conversations:", convError);
          return;
        }

        const hasOutputs = outputs && outputs.length > 0;
        const hasConversations = conversations && conversations.length > 0;
        const isFullyProcessed = hasOutputs && hasConversations;
        
        setCurrentStageProcessed(isFullyProcessed);
        
        console.log("🔍 Current stage status check:", {
          stageId: currentStage,
          hasOutputs,
          hasConversations,
          isFullyProcessed,
          outputsCount: outputs?.length || 0,
          conversationsCount: conversations?.length || 0,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error("Error checking stage status:", error);
        toast.error("Error checking stage status");
      }
    };

    checkCurrentStageStatus();
  }, [currentStage, briefId]);

  // Verifica lo stato dello stage precedente
  useEffect(() => {
    const checkPreviousStageStatus = async () => {
      if (!currentStage || !briefId) return;

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      if (currentIndex <= 0) {
        setPreviousStageProcessed(true);
        return;
      }

      const previousStage = stages[currentIndex - 1];
      
      try {
        console.log("🔍 Checking previous stage outputs:", {
          briefId,
          previousStageId: previousStage.id,
          timestamp: new Date().toISOString()
        });

        const { data: outputs, error: outputError } = await supabase
          .from('brief_outputs')
          .select('*')
          .eq('stage_id', previousStage.id)
          .eq('brief_id', briefId);

        if (outputError) {
          console.error("Error checking previous stage outputs:", outputError);
          return;
        }

        const { data: conversations, error: convError } = await supabase
          .from('workflow_conversations')
          .select('*')
          .eq('stage_id', previousStage.id)
          .eq('brief_id', briefId);

        if (convError) {
          console.error("Error checking previous stage conversations:", convError);
          return;
        }

        const hasOutputs = outputs && outputs.length > 0;
        const hasConversations = conversations && conversations.length > 0;
        const isFullyProcessed = hasOutputs && hasConversations;

        setPreviousStageProcessed(isFullyProcessed);

        console.log("🔍 Previous stage status check:", {
          stageId: previousStage.id,
          hasOutputs,
          hasConversations,
          isFullyProcessed,
          outputsCount: outputs?.length || 0,
          conversationsCount: conversations?.length || 0,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error("Error checking previous stage status:", error);
        toast.error("Error checking previous stage status");
      }
    };

    checkPreviousStageStatus();
  }, [currentStage, stages, briefId]);

  const handleNextStage = async () => {
    if (!currentStage || !briefId) return;

    const currentIndex = stages.findIndex(s => s.id === currentStage);
    if (currentIndex === -1 || currentIndex >= stages.length - 1) return;

    const nextStage = stages[currentIndex + 1];

    if (!previousStageProcessed) {
      toast.error("Previous stage must be completed first");
      return;
    }

    if (!currentStageProcessed) {
      toast.error("Current stage must be completed first");
      return;
    }

    if (nextStage) {
      console.log("🚀 Processing next stage:", {
        currentStage,
        nextStageId: nextStage.id,
        nextStageName: nextStage.name,
        flowSteps: nextStage.flows?.flow_steps,
        timestamp: new Date().toISOString()
      });
      
      try {
        await onNextStage(null);
        toast.success(`Processing stage: ${nextStage.name}`);
      } catch (error) {
        console.error("Error processing next stage:", error);
        toast.error("Failed to process next stage");
      }
    }
  };

  return (
    <div className="flex justify-between items-center mt-4">
      <div className="flex gap-2">
        <Button
          onClick={handleNextStage}
          disabled={
            isProcessing ||
            !currentStageProcessed ||
            !previousStageProcessed ||
            stages.findIndex(s => s.id === currentStage) === stages.length - 1
          }
        >
          {isProcessing ? "Processing..." : "Next Stage"}
        </Button>
      </div>
    </div>
  );
};