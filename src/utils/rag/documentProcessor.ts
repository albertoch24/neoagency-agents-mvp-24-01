import { supabase } from "@/integrations/supabase/client";
import { Configuration, OpenAIApi } from "openai";

const getOpenAIKey = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const { data: secrets, error: secretsError } = await supabase
    .from('secrets')
    .select('secret')
    .eq('name', 'OPENAI_API_KEY')
    .single();

  if (secretsError || !secrets) {
    throw new Error('Failed to retrieve OpenAI API key');
  }

  return secrets.secret;
};

export const processDocument = async (
  content: string,
  metadata: Record<string, any> = {},
  dimensions: number = 1536
) => {
  console.log('Processing document:', {
    contentLength: content?.length,
    metadataKeys: Object.keys(metadata),
    dimensions,
    model: 'text-embedding-3-small'
  });

  try {
    const apiKey = await getOpenAIKey();
    
    const configuration = new Configuration({
      apiKey,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    });

    const openai = new OpenAIApi(configuration);

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-3-small",
      input: content,
      dimensions: dimensions
    });

    const [{ embedding }] = embeddingResponse.data.data;
    console.log('Successfully generated embedding with dimensions:', embedding.length);

    const { error: insertError } = await supabase
      .from('document_embeddings')
      .insert({
        content,
        metadata,
        embedding
      });

    if (insertError) {
      console.error('Error inserting document:', insertError);
      throw insertError;
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
  threshold: number = 0.8,
  limit: number = 5,
  dimensions: number = 1536
): Promise<any[]> {
  console.log('Querying documents:', { 
    query, 
    threshold, 
    limit, 
    dimensions,
    model: 'text-embedding-3-small'
  });

  try {
    const apiKey = await getOpenAIKey();
    
    const configuration = new Configuration({
      apiKey,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    });

    const openai = new OpenAIApi(configuration);

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-3-small",
      input: query,
      dimensions: dimensions
    });

    const [{ embedding }] = embeddingResponse.data.data;

    const { data: matches, error } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
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