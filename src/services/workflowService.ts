import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

export const processWorkflowStage = async (
  briefId: string,
  stage: Stage,
  flowSteps: any[]
) => {
  console.log("Processing workflow stage:", {
    briefId,
    stageId: stage.id,
    flowStepsCount: flowSteps.length
  });

  try {
    // Call the edge function to process the workflow
    const { error } = await supabase.functions.invoke("process-workflow-stage", {
      body: {
        briefId,
        stageId: stage.id,
        flowSteps
      }
    });

    if (error) {
      console.error("Error processing workflow stage:", error);
      throw error;
    }

    // Create workflow conversations for each flow step
    for (const step of flowSteps) {
      console.log("Creating workflow conversation for step:", step);
      
      const { error: conversationError } = await supabase
        .from("workflow_conversations")
        .insert({
          brief_id: briefId,
          stage_id: stage.id,
          agent_id: step.agent_id,
          content: JSON.stringify(step.outputs || []),
          output_type: "conversational",
          flow_step_id: step.id
        });

      if (conversationError) {
        console.error("Error creating workflow conversation:", conversationError);
        throw conversationError;
      }
    }

    console.log("Successfully processed workflow stage and created conversations");
    return true;
  } catch (error) {
    console.error("Error in processWorkflowStage:", error);
    toast.error("Failed to process workflow stage");
    throw error;
  }
};