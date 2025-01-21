import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStageProcessing = (briefId?: string, stageId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processStage = async (feedbackId: string | null) => {
    if (!briefId || !stageId) {
      console.error("Missing required parameters:", { briefId, stageId });
      return;
    }

    setIsProcessing(true);
    console.log("Starting stage processing:", {
      briefId,
      stageId,
      hasFeedback: !!feedbackId,
      timestamp: new Date().toISOString()
    });

    try {
      const { error } = await supabase.functions.invoke("process-workflow-stage", {
        body: { 
          briefId,
          stageId,
          feedbackId: feedbackId || null // Assicuriamoci che sia null se non presente
        }
      });

      if (error) {
        console.error("Error processing stage:", error);
        throw error;
      }

      toast.success("Stage processed successfully!");
    } catch (error) {
      console.error("Error in processStage:", error);
      toast.error("Failed to process stage");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processStage
  };
};