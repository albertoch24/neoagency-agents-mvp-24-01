import { supabase } from "@/integrations/supabase/client";
import { TextChunk, DocumentMetadata, EmbeddingVector } from "@/types/rag";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function processDocument(content: string, metadata: DocumentMetadata) {
  try {
    console.log('Processing document:', {
      contentLength: content.length,
      metadata
    });

    // Get the OpenAI API key from Supabase
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('secret')
      .eq('name', 'OPENAI_API_KEY')
      .single();

    if (secretError) {
      console.error('Error fetching OpenAI API key:', secretError);
      throw new Error('Failed to fetch OpenAI API key');
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: secretData.secret,
      modelName: "text-embedding-ada-002"
    });

    console.log('Generating embedding for content');
    const embedding = await embeddings.embedQuery(content);

    // Convert embedding array to string for storage
    const embeddingString = JSON.stringify(embedding);

    console.log('Storing document with embedding in Supabase');
    const { data, error } = await supabase
      .from('document_embeddings')
      .insert([
        {
          content,
          metadata,
          embedding: embeddingString
        }
      ])
      .select();

    if (error) {
      console.error('Error storing document:', error);
      throw error;
    }

    console.log('Document processed successfully:', {
      documentId: data[0].id,
      metadata
    });

    return data[0];
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

export async function queryDocuments(query: string, threshold = 0.8, limit = 5): Promise<TextChunk[]> {
  try {
    console.log('Querying documents:', { query, threshold, limit });

    // Get the OpenAI API key from Supabase
    const { data: secretData, error: secretError } = await supabase
      .from('secrets')
      .select('secret')
      .eq('name', 'OPENAI_API_KEY')
      .single();

    if (secretError) {
      console.error('Error fetching OpenAI API key:', secretError);
      throw new Error('Failed to fetch OpenAI API key');
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: secretData.secret,
      modelName: "text-embedding-ada-002"
    });

    const queryEmbedding = await embeddings.embedQuery(query);
    const queryEmbeddingString = JSON.stringify(queryEmbedding);

    const { data: chunks, error } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: queryEmbeddingString,
        match_threshold: threshold,
        match_count: limit
      }
    );

    if (error) {
      console.error('Error querying documents:', error);
      throw error;
    }

    // Transform the response to match TextChunk interface
    const transformedChunks: TextChunk[] = chunks.map(chunk => {
      // First ensure metadata is an object and not an array
      const metadataObj = typeof chunk.metadata === 'object' && !Array.isArray(chunk.metadata) ? chunk.metadata : {};
      
      return {
        content: chunk.content,
        metadata: {
          source: typeof metadataObj?.source === 'string' ? metadataObj.source : 'unknown',
          title: typeof metadataObj?.title === 'string' ? metadataObj.title : undefined,
          type: typeof metadataObj?.type === 'string' ? metadataObj.type : undefined
        }
      };
    });

    console.log('Retrieved relevant chunks:', {
      count: transformedChunks.length,
      similarityRange: chunks.length > 0 ? {
        min: Math.min(...chunks.map(c => c.similarity)),
        max: Math.max(...chunks.map(c => c.similarity))
      } : null
    });

    return transformedChunks;
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}