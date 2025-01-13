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
        metadata: chunk.metadata,
        timestamp: new Date().toISOString()
      });

      const embedding = await generateEmbedding(chunk.content);
      
      console.log('Generated embedding:', {
        embeddingLength: embedding.length,
        embeddingPreview: embedding.slice(0, 5),
        timestamp: new Date().toISOString()
      });

      // Convert embedding array to string format for database storage
      const embeddingString = `[${embedding.join(',')}]`;

      console.log('Preparing database insert:', {
        content: chunk.content.substring(0, 100) + '...',
        metadataKeys: Object.keys(chunk.metadata),
        embeddingStringLength: embeddingString.length,
        timestamp: new Date().toISOString()
      });

      const { data: insertedData, error: insertError } = await supabase
        .from('document_embeddings')
        .insert({
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: embeddingString
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting embedding:', {
          error: insertError,
          errorMessage: insertError.message,
          errorDetails: insertError.details,
          timestamp: new Date().toISOString()
        });
        throw insertError;
      }

      console.log('Successfully stored embedding:', {
        insertedId: insertedData?.id,
        timestamp: new Date().toISOString()
      });
    }

    console.log('Context enhancement completed:', {
      processedChunks: chunks.length,
      timestamp: new Date().toISOString()
    });

    return chunks;
  } catch (error: any) {
    console.error('Error in context enhancement:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}