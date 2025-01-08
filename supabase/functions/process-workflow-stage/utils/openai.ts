import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";
import { withRetry } from "./retry.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIApiKey) {
  throw new Error('OPENAI_API_KEY is not set');
}

const configuration = new Configuration({
  apiKey: openAIApiKey,
});

const openai = new OpenAIApi(configuration);

export async function generateAgentResponse(
  prompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
) {
  console.log('Generating agent response:', { 
    promptLength: prompt.length,
    temperature,
    maxTokens
  });
  
  return withRetry(
    async () => {
      const completion = await openai.createChatCompletion({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative agency professional. Provide detailed, actionable insights."
          },
          { role: "user", content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const response = completion.data.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }
      
      return response;
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt) => {
        console.error(`OpenAI API call failed (attempt ${attempt}):`, error);
      }
    }
  );
}