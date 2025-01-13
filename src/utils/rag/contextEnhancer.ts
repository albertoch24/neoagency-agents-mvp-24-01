import { queryDocuments } from "./documentProcessor";

export async function enhancePromptWithContext(prompt: string, briefId: string) {
  try {
    console.log('Enhancing prompt with RAG context:', {
      promptLength: prompt.length,
      briefId
    });

    // Query relevant documents
    const relevantChunks = await queryDocuments(prompt);

    if (!relevantChunks.length) {
      console.log('No relevant context found for prompt');
      return prompt;
    }

    // Format context from relevant chunks
    const context = relevantChunks
      .map(chunk => chunk.content)
      .join('\n\n');

    // Enhance prompt with context
    const enhancedPrompt = `
Context from relevant documents:
${context}

Original prompt:
${prompt}

Please consider the above context while responding to the prompt. Incorporate relevant insights from the context into your response while maintaining the requested output format.
`;

    console.log('Enhanced prompt with context:', {
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      contextChunks: relevantChunks.length
    });

    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with context:', error);
    // Fallback to original prompt if enhancement fails
    return prompt;
  }
}