import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Stage } from "@/types/workflow";

export const useStageProgression = (briefId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const checkStageCompletion = async (stageId: string): Promise<boolean> => {
    try {
      console.log("🔍 Checking stage completion:", {
        briefId,
        stageId,
        timestamp: new Date().toISOString()
      });

      if (!briefId || !stageId) {
        console.error("❌ Missing required parameters:", { briefId, stageId });
        return false;
      }

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

  const startStage = async (stageId: string, flowSteps: any[] = []) => {
    console.log("🚀 Starting stage processing:", {
      briefId,
      stageId,
      flowStepsCount: flowSteps?.length,
      timestamp: new Date().toISOString()
    });

    if (!briefId || !stageId) {
      console.error("❌ Missing required parameters:", { briefId, stageId });
      throw new Error("Missing required parameters");
    }

    setIsProcessing(true);
    const toastId = toast.loading(
      "Processing stage... This may take a few moments.",
      { duration: 60000 }
    );

    try {
      // Update brief status
      const { error: briefError } = await supabase
        .from("briefs")
        .update({
          current_stage: stageId,
          status: "in_progress"
        })
        .eq("id", briefId);

      if (briefError) {
        throw new Error(`Error updating brief: ${briefError.message}`);
      }

      console.log("📋 Flow steps to process:", {
        count: flowSteps?.length,
        steps: flowSteps
      });

      const { error } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId,
          flowSteps
        }
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw error;
      }

      toast.dismiss(toastId);
      toast.success("Stage processing completed successfully!");

      return true;
    } catch (error) {
      console.error("❌ Error in startStage:", error);
      toast.dismiss(toastId);
      toast.error("Failed to process stage. Please try again.");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStageProgression = async (
    currentStage: Stage,
    nextStage: Stage | null,
    flowSteps: any[] = []
  ) => {
    try {
      if (!briefId) {
        throw new Error("Missing briefId");
      }

      console.log("🔄 Stage progression initiated:", {
        currentStageId: currentStage.id,
        nextStageId: nextStage?.id,
        flowStepsCount: flowSteps?.length,
        timestamp: new Date().toISOString()
      });

      const isComplete = await checkStageCompletion(currentStage.id);
      
      if (!isComplete) {
        console.log("⚠️ Current stage not complete:", currentStage.id);
        toast.error("Please complete the current stage before proceeding.");
        return;
      }

      if (!nextStage) {
        console.log("✅ Final stage completed");
        toast.success("All stages completed!");
        return;
      }

      console.log("✨ Starting next stage:", nextStage.id);
      await startStage(nextStage.id, flowSteps);

    } catch (error) {
      console.error("❌ Error in handleStageProgression:", error);
      toast.error("Failed to progress to next stage");
    }
  };

  return {
    isProcessing,
    checkStageCompletion,
    startStage,
    handleStageProgression
  };
};