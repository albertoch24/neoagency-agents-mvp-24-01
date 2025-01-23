import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    hasOutputs: boolean;
    hasValidContent: boolean;
    hasConversations: boolean;
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useStageValidation = (
  currentStage: string,
  briefId?: string,
  stages?: Stage[]
) => {
  const [currentStageProcessed, setCurrentStageProcessed] = useState(false);
  const [previousStageProcessed, setPreviousStageProcessed] = useState(false);

  const validateOutputContent = (content: any): boolean => {
    try {
      if (!content) {
        console.warn("❌ No content provided for validation");
        return false;
      }
      
      // Check if content has outputs array
      if (!content.outputs || !Array.isArray(content.outputs)) {
        console.warn("❌ Invalid content structure: missing outputs array");
        return false;
      }

      // Verify each output has required fields and valid content
      const isValid = content.outputs.every((output: any) => {
        const hasValidStructure = output && 
          Array.isArray(output.outputs) && 
          output.outputs.length > 0 &&
          output.outputs.every((o: any) => o.content && typeof o.content === 'string');
        
        if (!hasValidStructure) {
          console.warn("❌ Invalid output structure:", output);
        }
        return hasValidStructure;
      });

      console.log("✅ Content validation result:", {
        isValid,
        outputsCount: content.outputs.length,
        timestamp: new Date().toISOString()
      });

      return isValid;
    } catch (error) {
      console.error("❌ Error validating output content:", error);
      return false;
    }
  };

  const checkStageStatus = async (
    stageId: string, 
    briefId: string,
    retryCount = 0
  ): Promise<ValidationResult> => {
    try {
      console.log("🔍 Checking stage status:", {
        stageId,
        briefId,
        retryCount,
        timestamp: new Date().toISOString()
      });

      // Check outputs with count
      const { count: outputsCount, error: outputsError } = await supabase
        .from('brief_outputs')
        .select('*', { count: 'exact', head: true })
        .eq('stage_id', stageId)
        .eq('brief_id', briefId);

      if (outputsError) {
        console.error("❌ Error checking outputs:", outputsError);
        throw outputsError;
      }

      console.log("📊 Outputs count check:", {
        outputsCount,
        timestamp: new Date().toISOString()
      });

      // If we have outputs, validate their content
      let hasValidContent = false;
      if (outputsCount && outputsCount > 0) {
        const { data: outputs, error: contentError } = await supabase
          .from('brief_outputs')
          .select('content')
          .eq('stage_id', stageId)
          .eq('brief_id', briefId)
          .single();

        if (contentError) {
          console.error("❌ Error fetching output content:", contentError);
          throw contentError;
        }

        hasValidContent = validateOutputContent(outputs?.content);
        console.log("📝 Content validation result:", {
          hasValidContent,
          outputsCount,
          timestamp: new Date().toISOString()
        });
      }

      // Check conversations with count
      const { count: conversationsCount, error: conversationsError } = await supabase
        .from('workflow_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('stage_id', stageId)
        .eq('brief_id', briefId);

      if (conversationsError) {
        console.error("❌ Error checking conversations:", conversationsError);
        throw conversationsError;
      }

      console.log("💬 Conversations count check:", {
        conversationsCount,
        timestamp: new Date().toISOString()
      });

      const result: ValidationResult = {
        isValid: outputsCount > 0 && hasValidContent && conversationsCount > 0,
        details: {
          hasOutputs: outputsCount > 0,
          hasValidContent,
          hasConversations: conversationsCount > 0
        }
      };

      console.log("✅ Stage validation complete:", {
        stageId,
        result,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error("❌ Stage validation error:", {
        stageId,
        error,
        retryCount,
        timestamp: new Date().toISOString()
      });

      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        console.log("🔄 Retrying validation...", {
          retryCount: retryCount + 1,
          delay: RETRY_DELAY,
          timestamp: new Date().toISOString()
        });
        
        await delay(RETRY_DELAY);
        return checkStageStatus(stageId, briefId, retryCount + 1);
      }

      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: {
          hasOutputs: false,
          hasValidContent: false,
          hasConversations: false
        }
      };
    }
  };

  useEffect(() => {
    const validateStages = async () => {
      console.log("🚀 Starting stage validation with:", {
        currentStage,
        briefId,
        stagesCount: stages?.length,
        timestamp: new Date().toISOString()
      });

      if (!currentStage || !briefId || !stages?.length) {
        console.log("⚠️ Missing required data for validation:", {
          hasCurrentStage: !!currentStage,
          hasBriefId: !!briefId,
          hasStages: !!stages?.length,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const currentIndex = stages.findIndex(s => s.id === currentStage);
      
      // Check current stage completion
      const currentResult = await checkStageStatus(currentStage, briefId);
      console.log("✅ Current stage validation result:", {
        stageId: currentStage,
        result: currentResult,
        timestamp: new Date().toISOString()
      });
      setCurrentStageProcessed(currentResult.isValid);

      // Check previous stage if not first stage
      if (currentIndex > 0) {
        const previousStage = stages[currentIndex - 1];
        const previousResult = await checkStageStatus(previousStage.id, briefId);
        console.log("✅ Previous stage validation result:", {
          stageId: previousStage.id,
          result: previousResult,
          timestamp: new Date().toISOString()
        });
        setPreviousStageProcessed(previousResult.isValid);
      } else {
        // First stage doesn't need previous validation
        setPreviousStageProcessed(true);
      }
    };

    validateStages();
  }, [currentStage, briefId, stages]);

  return {
    currentStageProcessed,
    previousStageProcessed
  };
};