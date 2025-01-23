import { validateOutputs } from './outputManager.ts';

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

  console.log("🚀 Starting agent processing:", {
    agentId: agent.id,
    briefId: brief.id,
    stageId,
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
          content
        )
      `)
      .eq('id', agent.id)
      .single();

    if (error) throw error;
    if (!agentData) throw new Error('Agent not found');

    // Generate response using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are ${agentData.name}, analyzing and responding to this brief based on your expertise.`
          },
          {
            role: 'user',
            content: `Analyze this brief and provide your professional recommendations:\n\nTitle: ${brief.title}\nDescription: ${brief.description}\nObjectives: ${brief.objectives}`
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

    const output = {
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

    // Validate output before returning
    if (!validateOutputs([output])) {
      throw new Error('Generated output failed validation');
    }

    console.log("✅ Agent processing completed:", {
      agentId: agentData.id,
      agentName: agentData.name,
      outputLength: generatedContent.length,
      timestamp: new Date().toISOString()
    });

    return output;
  } catch (error) {
    console.error("❌ Error in processAgent:", {
      error,
      agentId: agent.id,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}