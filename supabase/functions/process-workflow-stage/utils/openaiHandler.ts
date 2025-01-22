export async function generateOpenAIResponse(systemPrompt: string, temperature: number = 0.7) {
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Based on the brief and requirements, provide your professional analysis and recommendations.' }
      ],
      temperature: temperature,
      max_tokens: 2500,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    }),
  });

  if (!openAIResponse.ok) {
    throw new Error(`OpenAI API error: ${openAIResponse.status}`);
  }

  return await openAIResponse.json();
}