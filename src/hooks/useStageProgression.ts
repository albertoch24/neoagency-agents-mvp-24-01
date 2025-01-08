import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Stage } from "@/types/workflow";

export const useStageProgression = (briefId?: string) => {
  const queryClient = useQueryClient();

  const isStageCompleted = async (stageId: string) => {
    if (!briefId) return false;
    
    try {
      console.log("Checking completion for stage:", stageId);
      
      // First check brief_outputs table
      const { data: outputs, error: outputsError } = await supabase
        .from("brief_outputs")
        .select("*")
        .eq("brief_id", briefId)
        .or(`stage_id.eq.${stageId},stage.eq.${stageId}`)
        .maybeSingle();

      if (outputsError) {
        console.error("Error checking outputs:", outputsError);
        return false;
      }

      // Log the check results
      console.log("Stage completion check - outputs:", {
        stageId,
        hasOutput: !!outputs,
        output: outputs
      });

      // If we have an output, the stage is completed
      if (outputs) {
        return true;
      }

      // If no outputs found, check workflow_conversations table
      const { data: conversation, error: convsError } = await supabase
        .from("workflow_conversations")
        .select("*")
        .eq("brief_id", briefId)
        .eq("stage_id", stageId)
        .maybeSingle();

      if (convsError) {
        console.error("Error checking conversations:", convsError);
        return false;
      }

      // Log conversations check
      console.log("Stage completion check - conversation:", {
        stageId,
        hasConversation: !!conversation,
        conversation: conversation
      });

      // A stage is completed if it has at least one conversation
      return !!conversation;
    } catch (error) {
      console.error("Error checking stage completion:", error);
      return false;
    }
  };

  const startStage = async (stageId: string) => {
    if (!briefId) {
      toast.error("No brief selected. Please select a brief first.");
      return;
    }

    if (!stageId) {
      toast.error("No stage selected. Please select a stage first.");
      return;
    }

    try {
      console.log('Starting stage with params:', { briefId, stageId });
      
      const { error } = await supabase.functions.invoke('process-workflow-stage', {
        body: { 
          briefId,
          stageId
        }
      });

      if (error) {
        console.error('Error starting stage:', error);
        throw error;
      }

      toast.success("Stage started successfully");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["stages"] });
      queryClient.invalidateQueries({ queryKey: ["brief-outputs", briefId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations", briefId] });
      
      return true;
    } catch (error) {
      console.error("Error starting stage:", error);
      toast.error("Failed to start stage");
      return false;
    }
  };

  const handleStageProgression = async (stage: Stage, index: number, stages: Stage[]) => {
    // If it's the first stage, allow starting it
    if (index === 0) {
      return startStage(stage.id);
    }

    // Check if previous stage is completed
    const previousStage = stages[index - 1];
    const isPreviousCompleted = await isStageCompleted(previousStage.id);

    if (isPreviousCompleted) {
      return startStage(stage.id);
    } else {
      toast.error("Please complete the previous stage first");
      return false;
    }
  };

  return {
    isStageCompleted,
    startStage,
    handleStageProgression
  };
};