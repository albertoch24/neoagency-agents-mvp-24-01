import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { FeedbackProcessor } from "./utils/FeedbackProcessor.ts";

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
    
    const body = await req.json().catch((e) => {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid request body');
    });
    
    const { briefId, stageId, feedbackId } = body;
    
    if (!briefId || !stageId) {
      console.error('❌ Missing required parameters:', { briefId, stageId });
      throw new Error('Missing required parameters: briefId and stageId are required');
    }

    console.log('📝 Request parameters:', { briefId, stageId, feedbackId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;
    if (feedbackId) {
      console.log('🔄 Processing feedback:', { feedbackId });
      const feedbackProcessor = new FeedbackProcessor(supabase);
      result = await feedbackProcessor.processFeedback(briefId, stageId, feedbackId);
      console.log('✅ Feedback processed:', result);
    }

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