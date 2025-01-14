import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { WorkflowStageProcessor } from "./utils/WorkflowStageProcessor.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Processing workflow stage request');
    
    const { briefId, stageId, flowSteps } = await req.json();
    
    // Validate required parameters
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch required data
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError || !brief) {
      throw new Error('Failed to fetch brief data');
    }

    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .select('*')
      .eq('id', stageId)
      .single();

    if (stageError || !stage) {
      throw new Error('Failed to fetch stage data');
    }

    // Process the stage using our new processor
    const processor = new WorkflowStageProcessor();
    const result = await processor.processStage(stage, brief);

    if (result.error) {
      throw new Error(result.message);
    }

    // Save the results
    const { error: saveError } = await supabase
      .from('workflow_conversations')
      .insert({
        brief_id: briefId,
        stage_id: stageId,
        content: result.result,
        output_type: 'conversational',
      });

    if (saveError) {
      throw saveError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: result.result,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
    
  } catch (error) {
    console.error('❌ Error processing workflow stage:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString(),
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});