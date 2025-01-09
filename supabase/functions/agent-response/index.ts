import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const buildDetailedSkillsPrompt = (skills: any[]) => {
  const prompt = skills.map(skill => `
    ${skill.name.toUpperCase()} EXPERTISE:
    ${skill.description}
    
    How to apply this skill:
    ${skill.content}
    
    Expected application:
    - Analyze the brief through the lens of ${skill.name}
    - Apply specific techniques from ${skill.name} expertise
    - Provide concrete recommendations based on ${skill.name} principles
  `).join('\n\n');
  
  console.log('Built skills prompt:', prompt);
  return prompt;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, input } = await req.json();
    console.log('Received request for agent:', agentId);
    console.log('Input:', input);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching agent details...');
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select(`
        *,
        skills (*)
      `)
      .eq('id', agentId)
      .single();

    if (agentError) {
      console.error('Error fetching agent:', agentError);
      throw agentError;
    }

    console.log('Agent details:', {
      name: agent.name,
      skillsCount: agent.skills?.length,
      temperature: agent.temperature
    });

    const systemPrompt = `You are ${agent.name}, a creative agency professional participating in a team meeting. 
    Your communication style should be natural, engaging, and conversational, as if you're speaking face-to-face.
    
    Key aspects of your communication:
    - Use first-person pronouns ("I think...", "In my experience...")
    - Include verbal fillers and transitions natural to spoken language
    - Express enthusiasm and emotion where appropriate
    - Reference team dynamics and collaborative aspects
    - Use industry jargon naturally but explain complex concepts
    - Share personal insights and experiences
    - Ask rhetorical questions to engage others
    - Use informal but professional language
    
    Your expertise and detailed skills:
    ${buildDetailedSkillsPrompt(agent.skills)}
    
    When responding:
    1. First, provide a natural, conversational analysis incorporating your skills
    2. Then, for each skill, provide specific insights and recommendations
    3. Finally, summarize how your skills combine to address the brief
    
    Structure your response as:
    
    ### Conversational Analysis
    [Your natural, engaging response]
    
    ### Skill-Based Insights
    ${agent.skills?.map(skill => `
    ${skill.name}:
    [Specific insights and recommendations based on ${skill.name}]`).join('\n')}
    
    ### Summary
    [How your skills work together to address the brief]
    
    ${agent.description}`;

    console.log('System prompt:', systemPrompt);
    console.log('Using temperature:', agent.temperature || 0.7);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: agent.temperature || 0.7,
        max_tokens: 2000,
      }),
    });

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response status:', openAIResponse.status);
    
    if (!openAIResponse.ok) {
      console.error('OpenAI error:', openAIData);
      throw new Error(`OpenAI API error: ${openAIData.error?.message || 'Unknown error'}`);
    }

    const response = openAIData.choices[0].message.content;
    console.log('Generated response length:', response.length);

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in agent-response function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});