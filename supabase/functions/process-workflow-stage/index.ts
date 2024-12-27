import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from './utils/cors.ts';
import { createOpenAIClient, createPrompt } from './utils/openai.ts';
import { 
  createSupabaseClient, 
  clearPreviousData, 
  createDefaultResponse,
  storeAgentResponse 
} from './utils/database.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { briefId, stageId } = await req.json();
    console.log('Processing stage:', stageId, 'for brief:', briefId);
    
    if (!briefId || !stageId) {
      throw new Error('Missing required parameters: briefId or stageId');
    }

    const supabaseClient = createSupabaseClient();

    // Fetch brief details
    const { data: brief, error: briefError } = await supabaseClient
      .from('briefs')
      .select('*')
      .eq('id', briefId)
      .single();

    if (briefError) {
      console.error('Error fetching brief:', briefError);
      throw briefError;
    }

    if (!brief) {
      throw new Error('Brief not found');
    }

    await clearPreviousData(supabaseClient, briefId, stageId);

    // Fetch non-paused agents with their skills
    const { data: agents, error: agentsError } = await supabaseClient
      .from('agents')
      .select(`
        *,
        skills (
          id,
          name,
          type,
          description,
          content
        )
      `)
      .eq('is_paused', false);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      throw agentsError;
    }

    if (!agents || agents.length === 0) {
      console.log('No active agents found, creating default response');
      await createDefaultResponse(supabaseClient, briefId, stageId);
      return new Response(
        JSON.stringify({ success: true, message: 'Created default response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openai = createOpenAIClient();
    console.log('Processing responses for', agents.length, 'active agents');

    // Process each agent's response
    for (const agent of agents) {
      try {
        const formattedSkills = agent.skills?.map((skill: any) => ({
          name: skill.name,
          type: skill.type,
          description: skill.description,
          content: skill.content
        })) || [];

        const prompt = createPrompt(agent, formattedSkills, brief, stageId);
        
        console.log('Calling OpenAI for agent:', agent.name);
        console.log('Agent skills:', formattedSkills);

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: 'Please provide your analysis and recommendations for this stage.' }
          ],
          temperature: 0.7,
        });

        const response = completion.choices[0].message.content;
        console.log('Received response from OpenAI for agent:', agent.name);

        await storeAgentResponse(supabaseClient, agent, response, briefId, stageId, formattedSkills);
      } catch (error) {
        console.error('Error processing agent:', agent.name, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-workflow-stage function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});