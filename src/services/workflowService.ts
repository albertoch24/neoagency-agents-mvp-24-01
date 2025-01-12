import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";

export const processWorkflowStage = async (briefId: string, stage: Stage, flowSteps: any[]) => {
  console.log("Processing workflow stage:", { briefId, stage, flowSteps });

  try {
    // Get brief details for brand context
    const { data: brief } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    // Process each flow step
    for (const step of flowSteps) {
      const { error } = await supabase.functions.invoke('process-workflow-stage', {
        body: {
          briefId,
          stageId: stage.id,
          flowStepId: step.id,
          brand: brief.brand,
        },
      });

      if (error) {
        console.error("Error invoking workflow stage function:", error);
        throw new Error('Failed to process workflow stage');
      }

      // Process stage output for RAG
      const { data: stageOutput } = await supabase
        .from('brief_outputs')
        .select('*')
        .eq('brief_id', briefId)
        .eq('stage_id', stage.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (stageOutput) {
        // Store stage insights in brand knowledge
        const { error: ragError } = await supabase.functions.invoke('rag-processor', {
          body: {
            brand: brief.brand,
            stage: stage.name,
            content: stageOutput.content,
            type: 'stage_output',
          },
        });

        if (ragError) {
          console.error("Error processing RAG:", ragError);
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error processing workflow stage:", error);
    throw error;
  }
};