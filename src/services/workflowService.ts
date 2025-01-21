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
    flowStepsCount: flowSteps?.length,
    timestamp: new Date().toISOString()
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

    // Log auth state
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Auth state during processing:", {
      hasSession: !!session,
      userId: session?.user?.id,
      tokenExpiry: session?.expires_at
    });

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

    // Create initial processing record
    const { error: progressError } = await supabase
      .from("processing_progress")
      .insert({
        brief_id: briefId,
        stage_id: stage.id,
        status: 'processing',
        progress: 0
      });

    if (progressError) {
      console.error("Error creating progress record:", progressError);
    }

    // Call the edge function with detailed logging
    console.log("Invoking edge function with params:", {
      briefId,
      stageId: stage.id,
      flowStepsCount: validatedFlowSteps.length,
      timestamp: new Date().toISOString()
    });

    const { error, data } = await supabase.functions.invoke("process-workflow-stage", {
      body: {
        briefId,
        stageId: stage.id,
        flowSteps: validatedFlowSteps
      }
    });

    if (error) {
      console.error("Error processing workflow stage:", {
        error,
        briefId,
        stageId: stage.id,
        timestamp: new Date().toISOString(),
        errorDetails: {
          message: error.message,
          name: error.name,
          cause: error.cause
        }
      });
      throw error;
    }

    console.log("Successfully processed workflow stage:", {
      briefId,
      stageId: stage.id,
      responseData: data,
      timestamp: new Date().toISOString()
    });

    // Create workflow conversations for each flow step
    for (const step of validatedFlowSteps) {
      console.log("Creating workflow conversation for step:", {
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
          flow_step_id: step.id,
          version: 1
        });

      if (conversationError) {
        console.error("Error creating workflow conversation:", {
          error: conversationError,
          stepId: step.id,
          timestamp: new Date().toISOString()
        });
        throw conversationError;
      }
    }

    // Update progress to complete
    const { error: updateError } = await supabase
      .from("processing_progress")
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString()
      })
      .eq('brief_id', briefId)
      .eq('stage_id', stage.id);

    if (updateError) {
      console.error("Error updating progress:", updateError);
    }

    console.log("Successfully processed workflow stage and created conversations:", {
      briefId,
      stageId: stage.id,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error("Error in processWorkflowStage:", {
      error,
      briefId,
      stageId: stage.id,
      timestamp: new Date().toISOString(),
      errorDetails: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      } : 'Unknown error type'
    });

    // Update progress to failed
    const { error: updateError } = await supabase
      .from("processing_progress")
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('brief_id', briefId)
      .eq('stage_id', stage.id);

    if (updateError) {
      console.error("Error updating progress after failure:", updateError);
    }

    toast.error("Failed to process workflow stage");
    throw error;
  }
};