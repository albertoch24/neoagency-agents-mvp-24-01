import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processFeedbackWithLangChain } from "./utils/feedbackProcessor.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ccacac1a-1fad-41e2-8926-5a348f46ea42.lovableproject.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS request');
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Vary': 'Origin' // Important for caching with specific origins
      }
    });
  }

  try {
    console.log('🚀 Processing workflow stage request');
    
    // Parse request body
    const body = await req.json().catch((e) => {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid request body');
    });
    
    const { briefId, stageId, feedbackId } = body;
    
    // Validate required parameters
    if (!briefId || !stageId || !feedbackId) {
      console.error('❌ Missing required parameters:', { briefId, stageId, feedbackId });
      throw new Error('Missing required parameters');
    }

    console.log('📝 Request parameters:', { briefId, stageId, feedbackId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the original output first
    const { data: originalOutput, error: outputError } = await supabase
      .from('brief_outputs')
      .select('*')
      .eq('brief_id', briefId)
      .eq('stage_id', stageId)
      .eq('is_reprocessed', false)
      .maybeSingle();

    if (outputError) {
      console.error('❌ Error fetching original output:', outputError);
      throw new Error('Failed to fetch original output');
    }

    if (!originalOutput) {
      console.error('❌ No original output found for:', { briefId, stageId });
      throw new Error('No original output found to process feedback against');
    }

    console.log('✅ Found original output:', {
      outputId: originalOutput.id,
      hasContent: !!originalOutput.content
    });

    // Process feedback with the original output context
    const result = await processFeedbackWithLangChain(briefId, stageId, feedbackId, originalOutput);

    // Return success response with CORS headers
    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Vary': 'Origin'
        } 
      }
    );
    
  } catch (error) {
    console.error('❌ Error processing workflow stage:', {
      error,
      message: error.message,
      stack: error.stack
    });
    
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString(),
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Vary': 'Origin'
        }
      }
    );
  }
});