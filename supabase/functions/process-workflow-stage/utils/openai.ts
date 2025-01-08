import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  
  try {
    const completion = await withRetry(
      async () => {
        const response = await openai.createChatCompletion({
          model: "gpt-4o-mini",
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

        if (!response.data?.choices?.[0]?.message?.content) {
          throw new Error('No response content from OpenAI');
        }

        return response;
      },
      {
        maxRetries: 3,
        onRetry: (error, attempt) => {
          console.error(`OpenAI API call failed (attempt ${attempt}):`, error);
        }
      }
    );

    const response = completion.data.choices[0].message.content;
    console.log('OpenAI response generated successfully:', {
      responseLength: response.length,
      firstChars: response.substring(0, 100)
    });
    
    // Return both responses but with empty structured output
    return {
      conversationalResponse: response,
      schematicResponse: "" // Empty string instead of generating a structured output
    };
  } catch (error) {
    console.error('OpenAI API error details:', {
      error: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
  }
}