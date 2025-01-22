export async function generateOpenAIResponse(systemPrompt: string, temperature: number = 0.7) {
  console.log('🚀 Starting OpenAI API call:', {
    promptLength: systemPrompt.length,
    temperature,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('📝 OpenAI Request:', {
      model: 'gpt-4o',
      systemPrompt: systemPrompt.substring(0, 200) + '...',
      temperature,
      timestamp: new Date().toISOString()
    });

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
      const errorData = await openAIResponse.text();
      console.error('❌ OpenAI API Error:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        error: errorData,
        timestamp: new Date().toISOString()
      });
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorData}`);
    }

    const responseData = await openAIResponse.json();
    
    console.log('✅ OpenAI API Success:', {
      responseLength: responseData.choices[0].message.content.length,
      usage: responseData.usage,
      model: responseData.model,
      timestamp: new Date().toISOString()
    });

    // Log a sample of the response for debugging
    console.log('📄 Response Sample:', {
      content: responseData.choices[0].message.content.substring(0, 200) + '...',
      timestamp: new Date().toISOString()
    });

    return responseData;
  } catch (error) {
    console.error('❌ Error in generateOpenAIResponse:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}