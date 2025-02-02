import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const processWorkflowStage = async (
  briefId: string,
  stage: any,
  flowSteps: any[]
) => {
  console.log("Starting workflow stage processing:", {
    briefId,
    stageId: stage.id,
    flowStepsCount: flowSteps?.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Call the edge function to process the stage
    const { data, error } = await supabase.functions.invoke("process-workflow-stage", {
      body: { 
        briefId,
        stageId: stage.id,
        flowSteps,
        feedbackId: null
      }
    });

    if (error) {
      console.error("Error processing stage:", error);
      toast.error("Failed to process stage. Please try again.");
      throw error;
    }

    console.log("Stage processing completed:", {
      briefId,
      stageId: stage.id,
      outputs: data?.outputs,
      timestamp: new Date().toISOString()
    });

    // Save the brief output
    const { error: outputError } = await supabase
      .from("brief_outputs")
      .insert({
        brief_id: briefId,
        stage: stage.id,
        stage_id: stage.id,
        content: {
          stage_name: stage.name,
          flow_name: stage.flows?.name,
          agent_count: flowSteps.length,
          outputs: data?.outputs || []
        }
      });

    if (outputError) {
      console.error("Error saving brief output:", outputError);
      toast.error("Failed to save output. Please try again.");
      throw outputError;
    }

    // Save workflow conversations
    for (const output of data?.outputs || []) {
      const flowStep = flowSteps.find(step => step.agent_id === output.stepId);
      
      if (!flowStep) {
        console.error("Could not find matching flow step for agent:", output.stepId);
        continue;
      }

      console.log("Saving workflow conversation:", {
        briefId,
        stageId: stage.id,
        flowStepId: flowStep.id,
        agentId: output.stepId,
        timestamp: new Date().toISOString()
      });

      const { error: conversationError } = await supabase
        .from("workflow_conversations")
        .insert({
          brief_id: briefId,
          stage_id: stage.id,
          agent_id: output.stepId,
          content: output.outputs[0]?.content || "",
          output_type: "conversational",
          flow_step_id: flowStep.id // Using the correct flow step ID
        });

      if (conversationError) {
        console.error("Error saving workflow conversation:", conversationError);
        // Continue with other conversations even if one fails
      }
    }

    return data;
  } catch (error) {
    console.error("Error in processWorkflowStage:", error);
    throw error;
  }
};