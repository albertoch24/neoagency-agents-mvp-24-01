import { supabase } from "@/integrations/supabase/client";

export const generateEmbedding = async (content: string): Promise<number[]> => {
  console.log('Starting embeddings generation:', {
    contentLength: content.length,
    contentPreview: content.substring(0, 100),
    timestamp: new Date().toISOString(),
    model: 'text-embedding-3-small'
  });

  try {
    const { data, error } = await supabase.functions.invoke('process-embeddings', {
      body: { 
        content,
        model: 'text-embedding-3-small'
      }
    });

    if (error) {
      console.error('Error from embeddings function:', {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    if (!data?.embedding) {
      console.error('No embedding returned from function:', {
        data,
        timestamp: new Date().toISOString()
      });
      throw new Error('No embedding returned from function');
    }

    console.log('Embedding generated successfully:', {
      dimensions: data.embedding.length,
      embeddingPreview: data.embedding.slice(0, 5),
      timestamp: new Date().toISOString()
    });

    return data.embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}