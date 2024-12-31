import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

const createOpenAIClient = () => {
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  return new OpenAIApi(configuration);
};

export const generateAgentResponse = async (agentPrompt: string) => {
  console.log('Generating response for prompt:', agentPrompt);
  
  const openai = createOpenAIClient();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional creative agency expert." },
          { role: "user", content: agentPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('No content in OpenAI response');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI request:', error);
    throw new Error(`OpenAI request failed: ${error.message}`);
  }
};