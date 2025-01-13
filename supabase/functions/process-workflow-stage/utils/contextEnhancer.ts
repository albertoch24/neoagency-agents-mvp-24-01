import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";

export async function enhancePromptWithContext(prompt: string, briefId: string) {
  try {
    console.log('Enhancing prompt with RAG context:', {
      promptLength: prompt.length,
      briefId
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query relevant documents using match_documents function
    const { data: relevantChunks, error } = await supabase.rpc('match_documents', {
      query_embedding: await generateEmbedding(prompt),
      match_threshold: 0.8,
      match_count: 5
    });

    if (error) {
      console.error('Error querying documents:', error);
      return prompt;
    }

    if (!relevantChunks?.length) {
      console.log('No relevant context found for prompt');
      return prompt;
    }

    // Format context from relevant chunks
    const context = relevantChunks
      .map(chunk => chunk.content)
      .join('\n\n');

    // Enhance prompt with context
    const enhancedPrompt = `
Context from relevant documents:
${context}

Original prompt:
${prompt}

Please consider the above context while responding to the prompt. Incorporate relevant insights from the context into your response while maintaining the requested output format.
`;

    console.log('Enhanced prompt with context:', {
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      contextChunks: relevantChunks.length
    });

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with context:', error);
    // Fallback to original prompt if enhancement fails
    return prompt;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAIApi(new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  }));

  const response = await openai.createEmbedding({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data.data[0].embedding;
}