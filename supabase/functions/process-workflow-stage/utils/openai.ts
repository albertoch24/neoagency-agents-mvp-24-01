import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

export const createOpenAIClient = () => {
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  return new OpenAIApi(configuration);
};

export const generateAgentResponse = async (openai: OpenAIApi, agentPrompt: string) => {
  console.log('Generating response for prompt:', agentPrompt);
  
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional creative agency expert.' },
        { role: 'user', content: agentPrompt }
      ],
    });
    
    return completion.data.choices[0].message?.content || '';
  } catch (error) {
    console.error('Error generating OpenAI response:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
};