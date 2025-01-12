export interface RAGResponse {
  response: string;
  relevantDocs: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>;
}

export interface PromptSection {
  title: string;
  content: string;
}