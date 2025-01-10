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
    const { data, error } = await supabase.functions.invoke('rag-processor', {
      body: JSON.stringify({
        query,
        briefId,
        context
      })
    });

    if (error) throw error;

    return data as RAGResponse;
  } catch (error) {
    console.error('Error querying RAG:', error);
    throw error;
  }
};