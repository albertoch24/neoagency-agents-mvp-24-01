const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function generateAgentResponse(prompt: string, systemPrompt: string = '') {
  try {
    console.log('🤖 Generating agent response:', {
      promptLength: prompt.length,
      hasSystemPrompt: !!systemPrompt,
      timestamp: new Date().toISOString()
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt || 'You are a helpful assistant that generates content based on user prompts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Generated response successfully:', {
      responseLength: data.choices[0].message.content.length,
      timestamp: new Date().toISOString()
    });

    return {
      conversationalResponse: data.choices[0].message.content,
      rawResponse: data
    };
  } catch (error) {
    console.error('❌ Error generating response:', {
      error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}