import { supabase } from "@/integrations/supabase/client";

export const processDocument = async (
  content: string,
  metadata: Record<string, any> = {},
  dimensions: number = 1536
) => {
  console.log('Processing document:', {
    contentLength: content?.length,
    metadataKeys: Object.keys(metadata),
    dimensions
  });

  try {
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: { content, metadata, dimensions }
    });

    if (error) {
      console.error('Error processing document:', error);
      throw error;
    }

    console.log('Successfully processed and stored document');
    return true;

  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

export const queryDocuments = async (
  query: string,
  threshold = 0.8,
  limit = 5,
  dimensions = 1536
) => {
  console.log('Querying documents:', { 
    query, 
    threshold, 
    limit, 
    dimensions
  });

  try {
    const { data: matches, error } = await supabase
      .rpc('match_documents', {
        query_embedding: query,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) {
      console.error('Error matching documents:', error);
      throw error;
    }

    return matches;

  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
};