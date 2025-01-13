import { LoadedDocument } from "./documentLoader";

export interface TextChunk {
  content: string;
  metadata: LoadedDocument['metadata'];
}

export function splitDocuments(
  documents: LoadedDocument[],
  chunkSize: number = 1000,
  overlap: number = 200
): TextChunk[] {
  console.log(`Splitting documents into chunks of size ${chunkSize} with overlap ${overlap}`);
  
  const chunks: TextChunk[] = [];

  for (const doc of documents) {
    const text = doc.content;
    let index = 0;

    while (index < text.length) {
      const chunk = text.slice(index, index + chunkSize);
      chunks.push({
        content: chunk,
        metadata: { ...doc.metadata }
      });

      // Move forward by chunkSize - overlap
      index += (chunkSize - overlap);
    }
  }

  console.log(`Created ${chunks.length} chunks from ${documents.length} documents`);
  return chunks;
}