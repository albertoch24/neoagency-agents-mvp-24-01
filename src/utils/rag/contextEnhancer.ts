import { TextChunk } from "@/types/rag";
import { generateEmbedding } from "@/services/embeddingsService";
import { supabase } from "@/integrations/supabase/client";

export async function enhanceContext(chunks: TextChunk[]): Promise<TextChunk[]> {
  console.log('Starting context enhancement:', {
    chunksCount: chunks.length,
    timestamp: new Date().toISOString()
  });

  try {
    for (const chunk of chunks) {
      console.log('Processing chunk:', {
        contentLength: chunk.content.length,
        contentPreview: chunk.content.substring(0, 100),
        timestamp: new Date().toISOString()
      });

      const embedding = await generateEmbedding(chunk.content);

      console.log('Chunk embedding generated:', {
        dimensions: embedding.length,
        timestamp: new Date().toISOString()
      });

      const { error: insertError } = await supabase
        .from('document_embeddings')
        .insert({
          content: chunk.content,
          metadata: chunk.metadata,
          embedding
        });

      if (insertError) {
        console.error('Error inserting embedding:', {
          error: insertError,
          timestamp: new Date().toISOString()
        });
        throw insertError;
      }

      console.log('Chunk processed and stored successfully');
    }

    console.log('Context enhancement completed:', {
      processedChunks: chunks.length,
      timestamp: new Date().toISOString()
    });

    return chunks;
  } catch (error) {
    console.error('Error in context enhancement:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}