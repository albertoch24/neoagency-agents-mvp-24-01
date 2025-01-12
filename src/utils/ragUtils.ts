import { supabase } from "@/integrations/supabase/client";

export interface RAGResponse {
  response: string;
  relevantDocs: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>;
}

export const queryRAG = async (
  query: string,
  briefId?: string,
  context?: string
): Promise<RAGResponse> => {
  try {
    // Validate query string
    if (!query?.trim()) {
      console.error('Invalid query:', query);
      throw new Error('Query string cannot be empty');
    }

    console.log('Sending RAG query:', { query, briefId, context });
    
    const { data, error } = await supabase.functions.invoke('rag-processor', {
      body: {
        query: query.trim(),
        briefId,
        context
      }
    });

    if (error) {
      console.error('Error querying RAG:', error);
      throw error;
    }

    console.log('RAG response:', data);
    return data as RAGResponse;
  } catch (error) {
    console.error('Error querying RAG:', error);
    throw error;
  }
};