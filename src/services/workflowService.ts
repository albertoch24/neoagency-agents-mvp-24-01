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
      const response = await fetch('/api/process-workflow-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefId,
          stageId: stage.id,
          flowStepId: step.id,
          brand: brief.brand,
        }),
      });

      if (!response.ok) {
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
        await fetch('http://localhost:54321/functions/v1/rag-processor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            brand: brief.brand,
            stage: stage.name,
            content: stageOutput.content,
            type: 'stage_output',
          }),
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error processing workflow stage:", error);
    throw error;
  }
};