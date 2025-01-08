import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";
import { retryOperation } from "./retry.ts";

export async function processAgentPrompt(
  openai: OpenAIApi,
  prompt: string,
  temperature: number = 0.7
) {
  console.log("Sending prompt to OpenAI:", prompt);
  
  const completion = await retryOperation(async () => {
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are a creative agency professional. Provide detailed, actionable insights.'
        },
        { role: 'user', content: prompt }
      ],
      temperature,
    });
    return response;
  });

  const response = completion.data.choices[0]?.message?.content;
  
  if (!response) {
    console.error('No response from OpenAI');
    throw new Error('No response from OpenAI');
  }

  return response;
}