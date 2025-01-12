import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { RAGResponse } from './types';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getRelevantDocuments(
  briefId: string,
  query: string,
  maxResults: number = 3
): Promise<RAGResponse[]> {
  try {
    console.log('Getting relevant documents for:', { briefId, query });

    // Generate embedding for the query
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
    });

    // Get the brand associated with this brief
    const { data: brief, error: briefError } = await supabase
      .from('briefs')
      .select('brand')
      .eq('id', briefId)
      .single();

    if (briefError || !brief?.brand) {
      console.error('Error getting brief:', briefError);
      return [];
    }

    // Search for relevant documents using vector similarity
    const { data: documents, error: docsError } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding.data[0].embedding,
        match_threshold: 0.5,
        match_count: maxResults
      });

    if (docsError) {
      console.error('Error searching documents:', docsError);
      return [];
    }

    // Filter documents by brand and transform to RAGResponse format
    const relevantDocs = documents
      .filter(doc => doc.metadata?.brand === brief.brand)
      .map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity
      }));

    console.log('Found relevant documents:', {
      count: relevantDocs.length,
      similarities: relevantDocs.map(d => d.similarity)
    });

    return relevantDocs;
  } catch (error) {
    console.error('Error in getRelevantDocuments:', error);
    return [];
  }
}

export function buildContextFromDocs(docs: RAGResponse[]): string {
  if (!docs.length) return '';

  return `
Relevant context from brand documents:

${docs.map((doc, index) => `
Document ${index + 1} (Similarity: ${(doc.similarity * 100).toFixed(1)}%):
${doc.content}
`).join('\n')}

Please incorporate this context into your response where relevant.
`;
}