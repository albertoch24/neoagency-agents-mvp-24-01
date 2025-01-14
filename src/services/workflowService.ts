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
    flowStepsCount: flowSteps?.length
  });

  try {
    // Validate inputs before making the request
    if (!briefId) {
      throw new Error("Brief ID is required");
    }
    if (!stage?.id) {
      throw new Error("Stage ID is required");
    }
    if (!Array.isArray(flowSteps)) {
      throw new Error("Flow steps must be an array");
    }
    if (flowSteps.length === 0) {
      throw new Error("Flow steps array cannot be empty");
    }

    // Validate each flow step and ensure proper structure
    const validatedFlowSteps = flowSteps.map((step, index) => {
      if (!step) {
        throw new Error(`Flow step ${index} is undefined`);
      }
      if (!step.agent_id) {
        throw new Error(`Flow step ${index} is missing agent_id`);
      }
      if (typeof step.order_index !== 'number') {
        throw new Error(`Flow step ${index} is missing order_index`);
      }
      return {
        id: step.id,
        agent_id: step.agent_id,
        order_index: step.order_index,
        requirements: step.requirements || '',
        outputs: Array.isArray(step.outputs) ? step.outputs : []
      };
    });

    console.log("Validated flow steps:", validatedFlowSteps);

    // Call the edge function
    const { error, data } = await supabase.functions.invoke("process-workflow-stage", {
      body: {
        briefId,
        stageId: stage.id,
        flowSteps: validatedFlowSteps
      }
    });

    if (error) {
      console.error("Error processing workflow stage:", error);
      throw error;
    }

    console.log("Successfully processed workflow stage:", data);

    // Create workflow conversations for each flow step
    for (const step of validatedFlowSteps) {
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