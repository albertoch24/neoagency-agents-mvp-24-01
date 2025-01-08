import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export const useStageProgress = () => {
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const briefId = searchParams.get('briefId');

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

      setCurrentStage(stageId);
      toast.success("Stage started successfully");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["stages"] });
      queryClient.invalidateQueries({ queryKey: ["brief-outputs", briefId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-conversations", briefId] });
    } catch (error) {
      console.error("Error starting stage:", error);
      toast.error("Failed to start stage");
    }
  };

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

  // Set initial stage from URL if present
  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage) {
      setCurrentStage(stage);
    }
  }, [searchParams]);

  return {
    currentStage,
    startStage,
    isStageCompleted,
  };
};