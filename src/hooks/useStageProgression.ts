import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Stage } from "@/types/workflow";

export const useStageProgression = (briefId?: string) => {
  const queryClient = useQueryClient();

  const isStageCompleted = async (stageId: string) => {
    if (!briefId) return false;
    
    try {
      console.log("🔍 Checking completion for stage:", {
        stageId,
        briefId,
        timestamp: new Date().toISOString()
      });
      
      // First check brief_outputs table
      const { data: outputs, error: outputsError } = await supabase
        .from("brief_outputs")
        .select("content")
        .eq("brief_id", briefId)
        .eq("stage_id", stageId)
        .maybeSingle();

      if (outputsError) {
        console.error("❌ Error checking outputs:", outputsError);
        return false;
      }

      // If we have content in brief_outputs, check conversations
      if (outputs?.content) {
        console.log("✅ Found content in brief_outputs");
        
        // Check for workflow_conversations
        const { data: conversations, error: convsError } = await supabase
          .from("workflow_conversations")
          .select("*")
          .eq("brief_id", briefId)
          .eq("stage_id", stageId)
          .maybeSingle();

        if (convsError) {
          console.error("❌ Error checking conversations:", convsError);
          return false;
        }

        const isComplete = !!conversations;
        console.log("💬 Stage completion status:", {
          stageId,
          hasConversations: isComplete
        });

        return isComplete;
      }

      return false;
    } catch (error) {
      console.error("❌ Error checking stage completion:", error);
      return false;
    }
  };

  const startStage = async (stageId: string) => {
    if (!briefId) {
      toast.error("No brief selected. Please select a brief first.");
      return false;
    }

    if (!stageId) {
      toast.error("No stage selected. Please select a stage first.");
      return false;
    }

    try {
      console.log('🚀 Starting stage processing:', { 
        briefId, 
        stageId,
        timestamp: new Date().toISOString()
      });

      // Get flow steps for the stage
      const { data: flowSteps, error: flowStepsError } = await supabase
        .from("flow_steps")
        .select(`
          *,
          agents (
            id,
            name,
            description,
            skills (*)
          )
        `)
        .eq("flow_id", stageId)
        .order("order_index", { ascending: true });

      if (flowStepsError) {
        console.error("❌ Error fetching flow steps:", flowStepsError);
        throw new Error(`Error fetching flow steps: ${flowStepsError.message}`);
      }

      console.log("📋 Flow steps retrieved:", {
        count: flowSteps?.length,
        steps: flowSteps
      });

      const { error } = await supabase.functions.invoke('process-workflow-stage', {
        body: { 
          briefId,
          stageId,
          flowSteps: flowSteps || []
        }
      });

      if (error) {
        console.error('❌ Error starting stage:', error);
        throw error;
      }

      toast.success("Stage started successfully");
      
      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stages"] }),
        queryClient.invalidateQueries({ queryKey: ["brief-outputs", briefId] }),
        queryClient.invalidateQueries({ queryKey: ["workflow-conversations", briefId] })
      ]);
      
      return true;
    } catch (error) {
      console.error("❌ Error starting stage:", error);
      toast.error("Failed to start stage. Please try again.");
      return false;
    }
  };

  const handleStageProgression = async (stage: Stage, index: number, stages: Stage[]) => {
    console.log("🔄 Handling stage progression:", {
      stageId: stage.id,
      stageName: stage.name,
      index,
      totalStages: stages.length
    });

    // If it's the first stage, allow starting it
    if (index === 0) {
      return startStage(stage.id);
    }

    // Check if previous stage is completed
    const previousStage = stages[index - 1];
    if (!previousStage) {
      console.error("❌ Previous stage not found");
      toast.error("Error finding previous stage");
      return false;
    }

    const isPreviousCompleted = await isStageCompleted(previousStage.id);
    console.log("✅ Previous stage completion check:", {
      previousStageId: previousStage.id,
      isCompleted: isPreviousCompleted
    });

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