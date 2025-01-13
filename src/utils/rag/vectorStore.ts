import { TextChunk } from "./textSplitter";
import { supabase } from "@/integrations/supabase/client";

export interface VectorizedChunk extends TextChunk {
  embedding: number[];
}

export async function storeChunks(chunks: TextChunk[]): Promise<void> {
  console.log('Storing chunks in vector store...');

  try {
    // Call the edge function to process chunks and store them
    const { data, error } = await supabase.functions.invoke('process-brand-documents', {
      body: { chunks }
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

    return data.chunks;
  } catch (error) {
    console.error('Error in retrieveRelevantChunks:', error);
    throw error;
  }
}