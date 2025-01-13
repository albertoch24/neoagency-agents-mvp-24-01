import { supabase } from "@/integrations/supabase/client";

export const generateEmbeddings = async (text: string) => {
  try {
    console.log('Requesting embeddings for text:', {
      textLength: text.length,
      preview: text.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase.functions.invoke('process-embeddings', {
      body: { text }
    });

    if (error) {
      console.error('Error generating embeddings:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('Embeddings generated successfully:', {
      dimensions: data.embedding.length,
      usage: data.usage,
      timestamp: new Date().toISOString()
    });

    return data.embedding;
  } catch (error) {
    console.error('Failed to generate embeddings:', {
      error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};