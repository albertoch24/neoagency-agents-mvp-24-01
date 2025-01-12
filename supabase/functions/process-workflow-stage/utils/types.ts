export interface RAGResponse {
  content: string;
  metadata?: {
    brand?: string;
    source?: string;
    [key: string]: any;
  };
  similarity: number;
}

export interface PromptSection {
  title: string;
  content: string;
}