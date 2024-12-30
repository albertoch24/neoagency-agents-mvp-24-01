import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0'

export function createOpenAIClient() {
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  return new OpenAIApi(configuration);
}

export async function generateAgentResponse(openai: OpenAIApi, agentPrompt: string) {
  const completion = await openai.createChatCompletion({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a professional creative agency expert.' },
      { role: 'user', content: agentPrompt }
    ],
  });
  
  return completion.data.choices[0].message?.content || '';
}