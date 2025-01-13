export interface TextChunk {
  content: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  source?: string;
  title?: string;
  type?: string;
  [key: string]: any;
}

export interface EmbeddingVector {
  embedding: number[];
  content: string;
  metadata: DocumentMetadata;
}