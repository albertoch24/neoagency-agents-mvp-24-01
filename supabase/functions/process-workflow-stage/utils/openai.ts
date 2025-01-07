import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const createOpenAIClient = () => {
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  return new OpenAIApi(configuration);
};

export const generateAgentResponse = async (agentPrompt: string) => {
  console.log('Generating response for prompt:', agentPrompt);
  
  try {
    // Validate OpenAI API key
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a creative agency professional participating in a team meeting. 
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

Structure your response in two distinct parts:
1. First, provide your analysis in a natural, conversational style as if you're speaking in a meeting. Use paragraphs, casual transitions, and a friendly tone.
2. Then, after '### Summary:', provide a concise, bullet-pointed list of key takeaways for documentation purposes.

Remember: The first part should feel like a transcript of someone speaking in a meeting, while the summary should be clear and structured for quick reference.`
          },
          { role: "user", content: agentPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API returned status ${response.status}: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI API response format:', data);
      throw new Error('No content in OpenAI response');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI request:', error);
    throw new Error(`OpenAI request failed: ${error.message}`);
  }
};