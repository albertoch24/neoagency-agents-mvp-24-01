import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, removeFile } from "@/utils/fileOperations";
import { FileList } from "./FileList";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  name: string;
  path: string;
}

export const DocumentUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    toast("Uploading...", {
      description: "Brand documents are being uploaded"
    });

    try {
      const uploadedPaths: string[] = [];
      
      for (const file of Array.from(files)) {
        const result = await uploadFile(file);
        if (result) {
          setUploadedFiles(prev => [...prev, result]);
          uploadedPaths.push(result.path);
        }
      }

      // Process the uploaded documents
      const { data: briefData, error: briefError } = await supabase
        .from('briefs')
        .select('id, brand')
        .single();

      if (briefError) {
        console.error('Error fetching brief:', briefError);
        throw new Error('Failed to fetch brief data');
      }

      const { error: processingError } = await supabase.functions.invoke(
        'process-brand-documents',
        {
          body: {
            filePaths: uploadedPaths,
            briefId: briefData.id,
            brand: briefData.brand
          }
        }
      );

      if (processingError) {
        console.error('Error processing documents:', processingError);
        throw new Error('Failed to process documents');
      }

      toast("Success", {
        description: "Documents uploaded and processed successfully",
      });
    } catch (error) {
      console.error('Upload/processing error:', error);
      toast("Error uploading or processing documents. Please try again.", {
        description: "Please try again later",
        style: { backgroundColor: 'red', color: 'white' }
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (filePath: string) => {
    try {
      await removeFile(filePath);
      setUploadedFiles(prev => prev.filter(file => file.path !== filePath));
      toast("Success", {
        description: "File removed successfully",
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast("Error removing file.", {
        description: "Please try again later",
        style: { backgroundColor: 'red', color: 'white' }
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormLabel>Brand Documents</FormLabel>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload Documents
        </Button>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.txt"
        />
      </div>
      <FileList files={uploadedFiles} onRemove={handleRemoveFile} />
    </div>
  );
};