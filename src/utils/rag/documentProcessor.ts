import { OpenAIEmbeddings } from "@langchain/openai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function getOpenAIKey() {
  try {
    const { data, error } = await supabase
      .from('secrets')
      .select('secret')
      .eq('name', 'OPENAI_API_KEY')
      .single();

    if (error) throw error;
    if (!data?.secret) throw new Error('OpenAI API key not found');

    return data.secret;
  } catch (error) {
    console.error('Error fetching OpenAI API key:', error);
    throw new Error('Failed to retrieve OpenAI API key');
  }
}

export async function processDocument(content: string, metadata: any = {}) {
  console.log('Processing document:', {
    contentLength: content?.length,
    metadataKeys: Object.keys(metadata)
  });

  try {
    const apiKey = await getOpenAIKey();
    
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: "text-embedding-ada-002",
      configuration: {
        defaultHeaders: {
          "Content-Type": "application/json"
        }
      }
    });

    console.log('Generating embedding for content...');
    const embedding = await embeddings.embedQuery(content);

    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    console.log('Successfully generated embedding');

    // Convert the embedding array to a string before inserting
    const { error: insertError } = await supabase
      .from('document_embeddings')
      .insert({
        content,
        metadata,
        embedding: JSON.stringify(embedding) // Convert array to string
      });

    if (insertError) {
      console.error('Error inserting document embedding:', insertError);
      throw insertError;
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error processing document:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    toast.error(`Error processing document: ${errorMessage}`);
    
    throw new Error(`Failed to process document: ${errorMessage}`);
  }
}

export async function queryDocuments(query: string, threshold = 0.8, limit = 5) {
  console.log('Querying documents:', { query, threshold, limit });

  try {
    const apiKey = await getOpenAIKey();
    
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: "text-embedding-ada-002",
      configuration: {
        defaultHeaders: {
          "Content-Type": "application/json"
        }
      }
    });

    const queryEmbedding = await embeddings.embedQuery(query);

    // Convert the query embedding to a string
    const { data: matches, error } = await supabase
      .rpc('match_documents', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit
      });

    if (error) {
      console.error('Error querying documents:', error);
      throw error;
    }

    return matches;

  } catch (error: any) {
    console.error('Error in document query:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    toast.error(`Error querying documents: ${errorMessage}`);
    throw new Error(`Failed to query documents: ${errorMessage}`);
  }
}