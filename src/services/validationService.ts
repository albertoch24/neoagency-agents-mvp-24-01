import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ValidationResult {
  isValid: boolean;
  message?: string;
  flowSteps?: any[];
}

export const validateWorkflowEntities = async (
  briefId: string,
  stageId: string
): Promise<ValidationResult> => {
  console.log("Validating workflow entities for brief:", briefId, "stage:", stageId);

  // Validate stage exists
  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select("*, flows(id, name)")
    .eq("id", stageId)
    .maybeSingle();

  if (stageError || !stage) {
    console.error("Stage validation failed:", stageError);
    return {
      isValid: false,
      message: "Stage not found or invalid"
    };
  }

  if (!stage.flow_id) {
    return {
      isValid: false,
      message: "Stage has no associated flow"
    };
  }

  // Validate flow steps exist and get their details
  const { data: flowSteps, error: flowStepsError } = await supabase
    .from("flow_steps")
    .select(`
      *,
      agents (
        id,
        name,
        description,
        skills (*)
      )
    `)
    .eq("flow_id", stage.flow_id)
    .order("order_index", { ascending: true });

  if (flowStepsError) {
    console.error("Flow steps validation failed:", flowStepsError);
    return {
      isValid: false,
      message: "Error fetching flow steps"
    };
  }

  if (!flowSteps?.length) {
    console.error("No flow steps found for flow:", stage.flow_id);
    return {
      isValid: false,
      message: "No flow steps found for this stage's flow"
    };
  }

  // Validate each flow step has required data
  const invalidSteps = flowSteps.filter(step => !step.id || !step.agent_id || !step.agents);
  if (invalidSteps.length > 0) {
    console.error("Invalid flow steps found:", invalidSteps);
    return {
      isValid: false,
      message: "Some flow steps are missing required data"
    };
  }

  console.log("All workflow entities validated successfully");
  return { 
    isValid: true,
    flowSteps 
  };
};