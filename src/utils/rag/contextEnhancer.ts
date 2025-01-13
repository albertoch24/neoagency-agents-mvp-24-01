import { generateEmbeddings } from "@/services/embeddingsService";

export const enhanceContextWithEmbeddings = async (text: string) => {
  try {
    console.log('Enhancing context for text:', {
      textLength: text.length,
      preview: text.substring(0, 100)
    });
    
    const embeddings = await generateEmbeddings(text);
    
    console.log('Context enhanced successfully with embeddings:', {
      embeddingsDimensions: embeddings.length
    });
    
    return {
      originalText: text,
      embeddings
    };
  } catch (error) {
    console.error('Error enhancing context:', error);
    // Return original text if enhancement fails
    return {
      originalText: text,
      embeddings: null
    };
  }
};