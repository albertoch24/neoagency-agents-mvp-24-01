import { supabase } from "@/integrations/supabase/client";

export const generateEmbedding = async (content: string): Promise<number[]> => {
  console.log('Calling embeddings service:', {
    contentLength: content.length,
    contentPreview: content.substring(0, 100),
    timestamp: new Date().toISOString()
  });

  try {
    const { data, error } = await supabase.functions.invoke('process-embeddings', {
      body: { content }
    });

    if (error) {
      console.error('Error from embeddings function:', {
        error,
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
      timestamp: new Date().toISOString()
    });

    return data.embedding;
  } catch (error) {
    console.error('Error generating embedding:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};