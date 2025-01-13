import { generateEmbeddings } from "@/services/embeddingsService";

export const enhanceContextWithEmbeddings = async (text: string) => {
  try {
    console.log('Enhancing context for text:', {
      textLength: text.length,
      preview: text.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    const embeddings = await generateEmbeddings(text);
    
    console.log('Context enhanced successfully with embeddings:', {
      embeddingsDimensions: embeddings.length,
      timestamp: new Date().toISOString()
    });
    
    return {
      originalText: text,
      embeddings
    };
  } catch (error) {
    console.error('Error enhancing context:', {
      error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    // Return original text if enhancement fails
    return {
      originalText: text,
      embeddings: null
    };
  }
};