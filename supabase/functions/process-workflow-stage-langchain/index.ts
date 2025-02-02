import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.10"
import { PromptTemplate } from "https://esm.sh/@langchain/core/prompts@0.0.10"
import { StringOutputParser } from "https://esm.sh/@langchain/core/output_parsers@0.0.10"
import { RunnableSequence } from "https://esm.sh/@langchain/core/runnables@0.0.10"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Log per debugging
  console.log("🚀 Edge Function ricevuta una richiesta", new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json()
    
    // Log dei parametri ricevuti
    console.log("📝 Parametri ricevuti:", { briefId, stageId, flowStepsCount: flowSteps?.length });

    if (!briefId || !stageId || !flowSteps) {
      console.error("❌ Parametri mancanti");
      throw new Error('Missing required parameters')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Log per verificare l'inizializzazione di Supabase
    console.log("✅ Client Supabase inizializzato");

    // Initialize LangChain components
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    const promptTemplate = PromptTemplate.fromTemplate(`
      Process the following brief with ID ${briefId} for stage ${stageId}.
      Flow steps: {flowSteps}
      Additional context: {context}
      
      Generate a detailed response following these requirements:
      1. Analyze the brief content
      2. Consider the stage objectives
      3. Process each flow step
      4. Generate appropriate outputs
      
      Response format:
      {
        "outputs": [
          {
            "stepId": "string",
            "agent": "string",
            "outputs": [
              {
                "type": "string",
                "content": "string"
              }
            ],
            "orderIndex": number
          }
        ]
      }
    `)

    // Log per verificare l'inizializzazione di LangChain
    console.log("✅ Componenti LangChain inizializzati");

    const chain = RunnableSequence.from([
      promptTemplate,
      model,
      new StringOutputParser(),
    ])

    // Get brief and stage data
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single()

    if (briefError) {
      console.error("❌ Errore nel recupero del brief:", briefError);
      throw briefError;
    }

    const { data: stage, error: stageError } = await supabaseClient
      .from('stages')
      .select('*')
      .eq('id', stageId)
      .single()

    if (stageError) {
      console.error("❌ Errore nel recupero dello stage:", stageError);
      throw stageError;
    }

    // Log dei dati recuperati
    console.log("✅ Dati recuperati:", { 
      briefFound: !!brief, 
      stageFound: !!stage 
    });

    // Process with LangChain
    const result = await chain.invoke({
      flowSteps: JSON.stringify(flowSteps),
      context: JSON.stringify({ brief, stage, feedbackId })
    })

    // Log del risultato
    console.log("✅ Elaborazione LangChain completata");

    const response = JSON.parse(result)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    // Log dettagliato dell'errore
    console.error("❌ Errore nell'elaborazione:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})