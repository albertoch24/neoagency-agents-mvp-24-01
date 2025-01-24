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
    const relevantContext = isFirstStage ? 
      'Initial stage - Focus on analyzing the brief and setting project foundation' :
      processRelevantContext(agentContext, previousOutputs, requirements);
    
    const relevantBriefInfo = filterRelevantBriefInfo(brief, agentContext, isFirstStage);

    // Generate response using OpenAI with enhanced prompt structure
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
            content: `You are ${agentData.name}, a specialized creative agency professional with deep expertise in your field.
Your role and expertise:
${agentData.skills?.map(skill => `
- ${skill.name}: ${skill.description || ''}
  ${skill.content || ''}
`).join('\n')}

${isFirstStage ? `
As this is the first stage of the project:
1. Focus on thorough analysis of the brief
2. Set clear project foundations and objectives
3. Identify key challenges and opportunities
4. Establish success metrics and KPIs
5. Outline initial strategic direction
` : `
Important guidelines:
1. Build upon previous work while adding your unique expertise
2. Ensure alignment with project objectives
3. Provide actionable insights and recommendations
4. Consider interdependencies with other team members
5. Maintain consistency with established direction
`}

Maintain a professional, strategic tone and provide detailed, actionable insights.`
          },
          {
            role: 'user',
            content: `Project Context:
${relevantBriefInfo}

Stage Requirements:
${requirements || 'No specific requirements provided'}

${!isFirstStage ? `Previous Context and Insights:
${relevantContext}` : ''}

Your task is to:
1. ${isFirstStage ? 'Conduct initial project analysis and set foundation' : 'Build upon existing work while adding your expertise'}
2. Address the stage requirements directly
3. Provide specific, actionable recommendations
4. ${isFirstStage ? 'Define clear objectives and success metrics' : 'Ensure integration with previous contributions'}
5. Outline concrete next steps
6. Consider project constraints (timeline, budget, etc.)
7. Highlight potential challenges and solutions

Provide a comprehensive, strategic response that demonstrates your expertise and moves the project forward.`
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