import { supabase } from "@/integrations/supabase/client";
import { TextChunk } from "./textSplitter";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function processDocument(content: string, metadata: any = {}) {
  try {
    console.log('Processing document:', {
      contentLength: content.length,
      metadata
    });

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002"
    });

    const embedding = await embeddings.embedQuery(content);

    const { data, error } = await supabase
      .from('document_embeddings')
      .insert([
        {
          content,
          metadata,
          embedding
        }
      ])
      .select();

    if (error) throw error;

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

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002"
    });

    const queryEmbedding = await embeddings.embedQuery(query);

    const { data: chunks, error } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      }
    );

    if (error) throw error;

    console.log('Retrieved relevant chunks:', {
      count: chunks.length,
      similarityRange: chunks.length > 0 ? {
        min: Math.min(...chunks.map(c => c.similarity)),
        max: Math.max(...chunks.map(c => c.similarity))
      } : null
    });

    return chunks.map(chunk => ({
      content: chunk.content,
      metadata: chunk.metadata
    }));
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}