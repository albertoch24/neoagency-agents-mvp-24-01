import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processFeedbackWithLangChain } from "./utils/feedbackProcessor.ts";
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
    
    const { briefId, stageId, feedbackId } = await req.json();
    
    // Validate required parameters
    if (!briefId || !stageId || !feedbackId) {
      console.error('❌ Missing required parameters:', { briefId, stageId, feedbackId });
      throw new Error('Missing required parameters');
    }

    console.log('📝 Request parameters:', { briefId, stageId, feedbackId });

    // Process feedback
    const result = await processFeedbackWithLangChain(briefId, stageId, feedbackId);

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
    
  } catch (error) {
    console.error('❌ Error processing workflow stage:', {
      error,
      message: error.message,
      stack: error.stack
    });
    
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