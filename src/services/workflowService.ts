import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { toast } from "sonner";

// Custom error class for workflow-specific errors
class WorkflowError extends Error {
  public errorCode: string;
  public context: Record<string, any>;
  public timestamp: string;
  public metrics?: Record<string, any>;

  constructor(message: string, errorCode: string, context: Record<string, any>) {
    super(message);
    this.name = 'WorkflowError';
    this.errorCode = errorCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      context: this.context,
      timestamp: this.timestamp,
      metrics: this.metrics,
      stack: this.stack
    };
  }
}

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
      throw new WorkflowError(
        "Brief ID is required",
        "INVALID_INPUT",
        { briefId }
      );
    }
    if (!stage?.id) {
      throw new WorkflowError(
        "Stage ID is required",
        "INVALID_INPUT",
        { stage }
      );
    }
    if (!Array.isArray(flowSteps)) {
      throw new WorkflowError(
        "Flow steps must be an array",
        "INVALID_INPUT",
        { flowSteps }
      );
    }
    if (flowSteps.length === 0) {
      throw new WorkflowError(
        "Flow steps array cannot be empty",
        "INVALID_INPUT",
        { flowSteps }
      );
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
        throw new WorkflowError(
          `Flow step ${index} is undefined`,
          "INVALID_FLOW_STEP",
          { stepIndex: index }
        );
      }
      if (!step.agent_id) {
        throw new WorkflowError(
          `Flow step ${index} is missing agent_id`,
          "INVALID_FLOW_STEP",
          { step, index }
        );
      }
      if (typeof step.order_index !== 'number') {
        throw new WorkflowError(
          `Flow step ${index} is missing order_index`,
          "INVALID_FLOW_STEP",
          { step, index }
        );
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
      throw new WorkflowError(
        "Error creating progress record",
        "PROGRESS_RECORD_ERROR",
        { error: progressError }
      );
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
      throw new WorkflowError(
        "Error processing workflow stage",
        "EDGE_FUNCTION_ERROR",
        {
          error,
          briefId,
          stageId: stage.id,
          timestamp: new Date().toISOString()
        }
      );
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
        throw new WorkflowError(
          "Error creating workflow conversation",
          "CONVERSATION_CREATE_ERROR",
          {
            error: conversationError,
            stepId: step.id,
            timestamp: new Date().toISOString()
          }
        );
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
      throw new WorkflowError(
        "Error updating progress",
        "PROGRESS_UPDATE_ERROR",
        { error: updateError }
      );
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
      errorDetails: error instanceof WorkflowError ? error.toJSON() : {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
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