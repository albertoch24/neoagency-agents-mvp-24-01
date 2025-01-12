import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

export const processWorkflowStage = async (
  briefId: string,
  stage: Stage,
  flowSteps: any[]
) => {
  console.log("🔄 Processing workflow stage:", {
    briefId,
    stageId: stage.id,
    flowStepsCount: flowSteps.length,
    timestamp: new Date().toISOString()
  });

  try {
    console.log("🚀 Calling edge function to process workflow stage");
    const { error } = await supabase.functions.invoke("process-workflow-stage", {
      body: {
        briefId,
        stageId: stage.id,
        flowSteps
      }
    });

    if (error) {
      console.error("❌ Error from edge function:", error);
      throw error;
    }

    console.log("✅ Edge function completed successfully");

    // Create workflow conversations for each flow step
    for (const step of flowSteps) {
      console.log("📝 Creating workflow conversation for step:", {
        stepId: step.id,
        agentId: step.agent_id,
        timestamp: new Date().toISOString()
      });
      
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
        console.error("❌ Error creating workflow conversation:", conversationError);
        throw conversationError;
      }
    }

    console.log("✅ Successfully processed workflow stage and created all conversations");
    return true;
  } catch (error) {
    console.error("❌ Error in processWorkflowStage:", error);
    toast.error("Failed to process workflow stage");
    throw error;
  }
};