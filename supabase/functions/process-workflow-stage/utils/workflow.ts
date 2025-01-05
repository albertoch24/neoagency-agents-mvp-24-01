import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = []
) {
  console.log('Processing agent:', {
    agentId: agent.id,
    agentName: agent.name,
    briefId: brief.id,
    stageId,
    requirements
  });

  try {
    // Generate both outputs using OpenAI
    const [conversationalResponse, structuredResponse] = await Promise.all([
      generateResponse(agent, brief, requirements, 'conversational'),
      generateResponse(agent, brief, requirements, 'structured')
    ]);

    return {
      outputs: [
        {
          content: JSON.stringify({
            systemInfo: {
              timestamp: new Date().toISOString(),
              agent: agent.name,
              type: 'conversational'
            },
            perimetroContent: conversationalResponse
          }),
          type: 'conversational'
        },
        {
          content: JSON.stringify({
            systemInfo: {
              timestamp: new Date().toISOString(),
              agent: agent.name,
              type: 'structured'
            },
            perimetroContent: structuredResponse
          }),
          type: 'structured'
        }
      ]
    };
  } catch (error) {
    console.error('Error in processAgent:', error);
    throw new Error(`Agent processing failed: ${error.message}`);
  }
}

async function generateResponse(
  agent: any,
  brief: any,
  requirements: string,
  type: 'conversational' | 'structured'
) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  const prompt = type === 'conversational' 
    ? generateConversationalPrompt(agent, brief, requirements)
    : generateStructuredPrompt(agent, brief, requirements);
  
  try {
    console.log(`Generating ${type} response with OpenAI`);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: type === 'conversational' 
              ? 'You are a creative professional speaking in a meeting. Be natural and conversational.'
              : 'You are a strategic analyst providing structured insights. Be clear and organized.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: type === 'conversational' ? 0.7 : 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error(`Error generating ${type} response:`, error);
    throw error;
  }
}

function generateConversationalPrompt(agent: any, brief: any, requirements: string) {
  return `
    As ${agent.name}, analyze this creative brief in a natural, conversational way:
    
    Brief Details:
    Title: ${brief.title}
    Description: ${brief.description}
    Objectives: ${brief.objectives}
    Requirements: ${requirements || ''}
    
    Your Role:
    ${agent.description}
    
    Skills:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
    
    Share your thoughts as if you're speaking in a creative agency meeting.
    Use natural, conversational language and express your professional opinion.
  `;
}

function generateStructuredPrompt(agent: any, brief: any, requirements: string) {
  return `
    As ${agent.name}, provide a structured analysis of this creative brief:
    
    Brief Details:
    Title: ${brief.title}
    Description: ${brief.description}
    Objectives: ${brief.objectives}
    Requirements: ${requirements || ''}
    
    Your Role:
    ${agent.description}
    
    Skills:
    ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
    
    Provide a clear, structured analysis with the following sections:
    1. Key Insights
    2. Strategic Recommendations
    3. Action Items
    4. Success Metrics
    
    Format your response with clear headings and bullet points.
    Focus on concrete, actionable items and measurable outcomes.
  `;
}