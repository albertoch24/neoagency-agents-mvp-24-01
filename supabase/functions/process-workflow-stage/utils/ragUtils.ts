import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../types/database.types';

export async function getRelevantDocuments(
  supabaseClient: ReturnType<typeof createClient<Database>>,
  briefId: string,
  query: string,
  limit = 5
) {
  try {
    const { data: documents, error } = await supabaseClient.rpc(
      'match_documents',
      {
        query_embedding: query,
        match_count: limit
      }
    );

    if (error) {
      console.error("Error fetching relevant documents:", error);
      return [];
    }

    // Filter for documents related to this brief
    return documents.filter(doc => 
      doc.metadata?.brief_id === briefId
    );
  } catch (error) {
    console.error("Error in getRelevantDocuments:", error);
    return [];
  }
}

export function formatDocumentsForContext(documents: any[]): string {
  if (!documents.length) return '';

  return `
Relevant context from uploaded documents:

${documents.map((doc, index) => `
[Document ${index + 1}]
${doc.content}
`).join('\n')}

Please use this context to inform your response while maintaining a natural conversational tone.
`;
}