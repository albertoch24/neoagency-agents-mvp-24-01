import { TextChunk, EmbeddingVector } from "@/types/rag";
import { supabase } from "@/integrations/supabase/client";

export async function storeChunks(chunks: TextChunk[]): Promise<void> {
  console.log('Storing chunks in vector store...');

  try {
    // Call the edge function to process chunks and store them
    const { data, error } = await supabase.functions.invoke('process-brand-documents', {
      body: { 
        chunks: chunks.map(chunk => ({
          ...chunk,
          metadata: chunk.metadata || {}
        }))
      }
    });

    if (error) {
      console.error('Error storing chunks:', error);
      throw error;
    }

    console.log('Successfully stored chunks:', data);
  } catch (error) {
    console.error('Error in storeChunks:', error);
    throw error;
  }
}

export async function retrieveRelevantChunks(query: string, limit: number = 5): Promise<TextChunk[]> {
  console.log('Retrieving relevant chunks for query:', query);

  try {
    const { data, error } = await supabase.functions.invoke('rag-processor', {
      body: { query, limit }
    });

    if (error) {
      console.error('Error retrieving chunks:', error);
      throw error;
    }

    // Ensure the returned chunks match the TextChunk interface
    const transformedChunks: TextChunk[] = data.chunks.map((chunk: any) => ({
      content: chunk.content,
      metadata: chunk.metadata || {}
    }));

    return transformedChunks;
  } catch (error) {
    console.error('Error in retrieveRelevantChunks:', error);
    throw error;
  }
}