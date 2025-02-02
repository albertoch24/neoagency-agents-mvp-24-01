import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.0.14";
import { initializeAgentExecutorWithOptions } from "https://esm.sh/langchain@0.0.200/agents";
import { DynamicStructuredTool } from "https://esm.sh/@langchain/core@0.1.18/tools";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const operationId = crypto.randomUUID();
  console.log('🚀 Starting LangChain workflow stage processing:', {
    operationId,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId, stageId, flowSteps, feedbackId } = await req.json();
    
    if (!briefId || !stageId || !Array.isArray(flowSteps)) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brief and stage details
    const [briefResult, stageResult] = await Promise.all([
      supabase.from('briefs').select('*').eq('id', briefId).single(),
      supabase.from('stages').select('*, flows(id, name, description)').eq('id', stageId).single()
    ]);

    if (briefResult.error) throw briefResult.error;
    if (stageResult.error) throw stageResult.error;

    const brief = briefResult.data;
    const currentStage = stageResult.data;

    // Create LangChain tools and agents
    const outputs = [];
    for (const step of flowSteps) {
      console.log('Processing flow step with LangChain:', {
        stepId: step.id,
        agentId: step.agent_id,
        timestamp: new Date().toISOString()
      });

      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*, skills(*)')
        .eq('id', step.agent_id)
        .single();

      if (agentError || !agent) {
        console.error('Agent not found:', step.agent_id);
        continue;
      }

      // Create LangChain agent
      const model = new ChatOpenAI({
        openAIApiKey,
        modelName: "gpt-4o-mini",
        temperature: agent.temperature || 0.7,
      });

      const tool = new DynamicStructuredTool({
        name: `process_${agent.name.toLowerCase().replace(/\s+/g, '_')}`,
        description: `Process request with ${agent.name}`,
        schema: z.object({
          input: z.string().describe("The input to process"),
        }),
        func: async ({ input }) => {
          const response = await model.invoke([
            {
              role: "system",
              content: `You are ${agent.name}, a specialized agent with the following skills:
                ${agent.skills?.map((skill: any) => `
                  - ${skill.name}: ${skill.description || ''}
                  ${skill.content || ''}`).join('\n')}
                
                Consider the project context:
                - Title: ${brief.title}
                - Description: ${brief.description}
                - Objectives: ${brief.objectives}
                - Target Audience: ${brief.target_audience}
                ${brief.budget ? `- Budget: ${brief.budget}` : ''}
                ${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}
                
                Requirements for this stage:
                ${step.requirements || 'No specific requirements provided'}
                
                Provide a detailed, actionable response that addresses the requirements directly.`
            },
            { role: "user", content: input }
          ]);

          return response.content;
        }
      });

      const executor = await initializeAgentExecutorWithOptions(
        [tool],
        model,
        {
          agentType: "structured-chat-zero-shot-react-description",
          verbose: true,
          maxIterations: 3,
        }
      );

      const result = await executor.invoke({
        input: `Analyze the brief and provide recommendations based on the requirements: ${step.requirements}`
      });

      const stepOutput = {
        stepId: step.agent_id,
        agent: agent.name,
        requirements: step.requirements,
        outputs: [{
          content: result.output,
          type: 'conversational'
        }]
      };

      outputs.push(stepOutput);
    }

    // Save outputs and update brief status
    const [outputResult, briefUpdateResult] = await Promise.all([
      supabase.from('brief_outputs').insert({
        brief_id: briefId,
        stage_id: stageId,
        stage: currentStage.name,
        content: {
          stage_name: currentStage.name,
          flow_name: currentStage.flows?.name,
          outputs
        },
        feedback_id: feedbackId || null,
        content_format: 'structured'
      }),
      supabase.from('briefs').update({ 
        current_stage: stageId,
        status: 'in_progress'
      }).eq('id', briefId)
    ]);

    if (outputResult.error) throw outputResult.error;
    if (briefUpdateResult.error) throw briefUpdateResult.error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        outputs,
        metrics: {
          operationId,
          processedAt: new Date().toISOString(),
          agentsProcessed: outputs.length,
          hasFeedback: !!feedbackId
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in LangChain workflow stage processing:', {
      operationId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.stack,
        context: {
          operationId,
          timestamp: new Date().toISOString()
        }
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