import { processRelevantContext, filterRelevantBriefInfo } from './contextProcessor';

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements: string,
  previousOutputs: any[] = [],
  isFirstStage: boolean = false
) {
  if (!agent?.id) {
    console.error("❌ Invalid agent data:", { agent });
    throw new Error("Agent data is missing or invalid");
  }

  console.log("🚀 Starting agent processing:", {
    agentId: agent.id,
    briefId: brief.id,
    stageId,
    isFirstStage,
    hasRequirements: !!requirements,
    previousOutputsCount: previousOutputs.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Get agent data
    const { data: agentData, error } = await supabase
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
          content,
          description
        )
      `)
      .eq('id', agent.id)
      .single();

    if (error) throw error;
    if (!agentData) throw new Error('Agent not found');

    const agentContext = {
      role: agentData.name,
      skills: agentData.skills || [],
      requirements: requirements || ''
    };

    // Process relevant context and brief information
    const relevantContext = processRelevantContext(agentContext, previousOutputs, requirements, isFirstStage);
    const relevantBriefInfo = filterRelevantBriefInfo(brief, agentContext, isFirstStage);

    // Generate response using OpenAI with new prompt structure
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are ${agentData.name}, a specialized creative agency professional.
Your role and expertise:
${agentData.skills?.map(skill => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

Important: ${isFirstStage ? 'This is the first stage. Focus on initial analysis and setting the foundation.' : 'Build upon previous work and avoid repeating basic project information.'}`
          },
          {
            role: 'user',
            content: `Project Context:
${relevantBriefInfo}

Stage Requirements:
${requirements || 'No specific requirements provided'}

${!isFirstStage ? `Previous Context:
${relevantContext}` : ''}

Focus your response on:
1. ${isFirstStage ? 'Initial project analysis and foundation setting' : 'Building upon previous work'}
2. Your specific expertise and unique contribution
3. Concrete action items and next steps
4. ${isFirstStage ? 'Setting clear objectives and success metrics' : 'Integration with previous team members\' contributions'}
5. Specific metrics and success criteria

${isFirstStage ? 'As this is the first stage, provide a comprehensive initial analysis that will guide subsequent stages.' : 'Build upon the existing work while adding your unique expertise.'}`
          }
        ],
        temperature: agentData.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiData = await response.json();
    const generatedContent = aiData.choices[0].message.content;

    console.log("✅ Agent processing completed:", {
      agentId: agentData.id,
      agentName: agentData.name,
      isFirstStage,
      outputLength: generatedContent.length,
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
      stepId: agentData.id
    };
  } catch (error) {
    console.error("❌ Error in processAgent:", {
      error,
      agentId: agent.id,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}