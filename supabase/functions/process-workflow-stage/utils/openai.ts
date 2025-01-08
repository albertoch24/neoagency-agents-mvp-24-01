const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function generateAgentResponse(prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates content based on user prompts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      conversationalResponse: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}