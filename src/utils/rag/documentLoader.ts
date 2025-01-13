import { supabase } from "@/integrations/supabase/client";
import { Document } from "langchain/document";

export interface LoadedDocument {
  content: string;
  metadata: {
    source: string;
    title?: string;
    type?: string;
  };
}

export async function loadDocumentsFromStorage(bucketName: string = 'brand_documents'): Promise<LoadedDocument[]> {
  try {
    console.log('Loading documents from storage bucket:', bucketName);
    
    const { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list();

    if (error) {
      console.error('Error listing files:', error);
      throw error;
    }

    const documents: LoadedDocument[] = [];
    
    for (const file of files || []) {
      const { data, error: downloadError } = await supabase
        .storage
        .from(bucketName)
        .download(file.name);

      if (downloadError) {
        console.error(`Error downloading file ${file.name}:`, downloadError);
        continue;
      }

      const text = await data.text();
      documents.push({
        content: text,
        metadata: {
          source: file.name,
          type: file.metadata?.mimetype || 'text/plain',
          title: file.name.split('.')[0]
        }
      });
    }

    console.log(`Loaded ${documents.length} documents from storage`);
    return documents;
  } catch (error) {
    console.error('Error in loadDocumentsFromStorage:', error);
    throw error;
  }
}