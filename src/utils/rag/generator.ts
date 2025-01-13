import { TextChunk } from "@/types/rag";
import { supabase } from "@/integrations/supabase/client";

export async function generateResponse(query: string, relevantChunks: TextChunk[]): Promise<string> {
  console.log('Generating response with context...');

  try {
    const { data, error } = await supabase.functions.invoke('process-workflow-stage', {
      body: {
        query,
        context: relevantChunks.map(chunk => chunk.content).join('\n\n'),
        model: 'gpt-4o-mini'
      }
    });

    if (error) {
      console.error('Error generating response:', error);
      throw error;
    }

    return data.response;
  } catch (error) {
    console.error('Error in generateResponse:', error);
    throw error;
  }
}