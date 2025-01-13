import { loadDocumentsFromStorage } from "./documentLoader";
import { splitDocuments } from "./textSplitter";
import { storeChunks, retrieveRelevantChunks } from "./vectorStore";
import { generateResponse } from "./generator";

export async function processDocuments() {
  try {
    // 1. Load documents
    const documents = await loadDocumentsFromStorage();
    
    // 2. Split into chunks
    const chunks = splitDocuments(documents);
    
    // 3. Store chunks with embeddings
    await storeChunks(chunks);
    
    console.log('Document processing completed successfully');
  } catch (error) {
    console.error('Error processing documents:', error);
    throw error;
  }
}

export async function queryRAG(query: string): Promise<string> {
  try {
    if (!query?.trim()) {
      throw new Error('A valid query string is required');
    }

    // 4. Retrieve relevant chunks
    const relevantChunks = await retrieveRelevantChunks(query);
    
    // 5. Generate response
    const response = await generateResponse(query, relevantChunks);
    
    return response;
  } catch (error) {
    console.error('Error querying RAG:', error);
    throw error;
  }
}