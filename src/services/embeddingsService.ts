import { supabase } from "@/integrations/supabase/client";

export const generateEmbeddings = async (text: string) => {
  try {
    console.log('Requesting embeddings for text:', text);
    
    const { data, error } = await supabase.functions.invoke('process-embeddings', {
      body: { text }
    });

    if (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }

    console.log('Embeddings generated successfully:', {
      dimensions: data.embedding.length,
      usage: data.usage
    });

    return data.embedding;
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    throw error;
  }
};