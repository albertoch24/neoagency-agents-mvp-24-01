import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processFeedbackWithLangChain } from "./utils/feedbackProcessor.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS request');
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
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
    
    const { briefId, stageId, flowSteps } = body;
    
    // Validate required parameters
    if (!briefId || !stageId || !flowSteps) {
      console.error('❌ Missing required parameters:', { briefId, stageId, flowSteps });
      throw new Error('Missing required parameters');
    }

    console.log('📝 Request parameters:', { briefId, stageId, flowStepsCount: flowSteps?.length });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the workflow stage
    const result = await processFeedbackWithLangChain(briefId, stageId, null, null);

    // Return success response with CORS headers
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
          'Content-Type': 'application/json'
        }
      }
    );
  }
});