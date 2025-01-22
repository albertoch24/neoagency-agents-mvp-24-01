import { createClient } from '@supabase/supabase-js';

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = []
) {
  if (!agent?.id) {
    console.error("❌ Invalid agent data:", { agent });
    throw new Error("Agent data is missing or invalid");
  }

  if (!brief?.id) {
    console.error("❌ Invalid brief data:", { brief });
    throw new Error("Brief data is missing or invalid");
  }

  console.log("🚀 Starting agent processing:", {
    agentId: agent.id,
    briefId: brief.id,
    stageId,
    hasRequirements: !!requirements,
    previousOutputsCount: previousOutputs.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Get complete agent data with retry logic
    const maxRetries = 3;
    let agentData = null;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select(`
            id,
            name,
            description,
            temperature,
            skills (
              id,
              name,
              type,
              content
            )
          `)
          .eq('id', agent.id)
          .single();

        if (error) throw error;

        if (data) {
          agentData = data;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error);
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!agentData) {
      throw lastError || new Error('Failed to fetch agent data after multiple attempts');
    }

    console.log("✅ Retrieved agent data:", {
      agentId: agentData.id,
      agentName: agentData.name,
      skillsCount: agentData.skills?.length || 0
    });

    // Parse requirements with error recovery
    let processedRequirements = [];
    try {
      if (requirements) {
        const sections = requirements.split('\n\n').filter(Boolean);
        processedRequirements = sections.map(section => {
          const lines = section.split('\n').filter(line => line.trim());
          const title = lines[0]?.replace(':', '').trim() || 'General';
          const points = lines.slice(1).map(p => p.trim().replace(/^[•-]\s*/, ''));
          return { title, points };
        });
      }
    } catch (parseError) {
      console.error("❌ Error parsing requirements:", parseError);
      processedRequirements = [{
        title: 'General',
        points: [requirements || 'No specific requirements provided']
      }];
    }

    // Build system prompt with context from brief and previous outputs
    const systemPrompt = `You are ${agentData.name}, a specialized creative agency professional with the following skills:
${agentData.skills?.map((skill: any) => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

Your task is to analyze and respond to this brief based on your expertise.
Consider the project context:
- Title: ${brief.title || ''}
- Description: ${brief.description || ''}
- Objectives: ${brief.objectives || ''}
${brief.target_audience ? `- Target Audience: ${brief.target_audience}` : ''}
${brief.budget ? `- Budget: ${brief.budget}` : ''}
${brief.timeline ? `- Timeline: ${brief.timeline}` : ''}

Requirements for this stage:
${processedRequirements.map(section => 
  `${section.title}:\n${section.points.map(point => `- ${point}`).join('\n')}`
).join('\n\n')}

${previousOutputs.length > 0 ? `
Consider previous outputs from team members:
${previousOutputs.map(output => `
${output.agent}: ${output.content}
`).join('\n')}
` : ''}

Provide a detailed, actionable response that:
1. Analyzes the brief through your professional lens
2. Offers specific recommendations based on your skills
3. Addresses the stage requirements directly
4. Proposes next steps and action items`;

    // Generate response using OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Based on the brief and requirements, provide your professional analysis and recommendations.` }
        ],
        temperature: agentData.temperature || 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const aiData = await openAIResponse.json();
    const generatedContent = aiData.choices[0].message.content;

    console.log("✅ Successfully generated response for agent:", {
      agentId: agentData.id,
      agentName: agentData.name,
      responseLength: generatedContent.length,
      timestamp: new Date().toISOString()
    });

    return {
      agent: agentData.name,
      requirements,
      outputs: [
        {
          content: generatedContent,
          type: 'conversational'
        }
      ],
      stepId: agentData.id,
      orderIndex: previousOutputs.length
    };

  } catch (error) {
    console.error("❌ Error in processAgent:", {
      error,
      agentId: agent?.id,
      briefId: brief?.id,
      stageId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}