import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FirecrawlApp from '@mendable/firecrawl-js';

interface BriefFormFieldsProps {
  form: UseFormReturn<any>;
}

interface UploadedFile {
  name: string;
  path: string;
}

export const BriefFormFields = ({ form }: BriefFormFieldsProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleWebsiteCrawl = async () => {
    const websiteUrl = form.getValues("website");
    if (!websiteUrl) {
      toast({
        title: "Error",
        description: "Please enter a website URL first",
        variant: "destructive",
      });
      return;
    }

    setIsCrawling(true);
    toast({
      title: "Crawling website",
      description: "Please wait while we analyze the brand website...",
    });

    try {
      const { data: { secret } } = await supabase
        .from('secrets')
        .select('secret')
        .eq('name', 'FIRECRAWL_API_KEY')
        .single();

      if (!secret) {
        toast({
          title: "Error",
          description: "Firecrawl API key not configured",
          variant: "destructive",
        });
        return;
      }

      const firecrawl = new FirecrawlApp({ apiKey: secret });
      const response = await firecrawl.crawlUrl(websiteUrl, {
        limit: 100,
        scrapeOptions: {
          formats: ['markdown', 'html'],
        }
      });

      if (response.success) {
        // Transform the Firecrawl response into a compatible JSON format
        const formattedContent = {
          pages: response.data.map((doc: any) => ({
            url: doc.url,
            title: doc.title,
            content: doc.content,
            metadata: {
              crawledAt: new Date().toISOString(),
              format: doc.format
            }
          }))
        };

        // Store crawled data in brand_knowledge
        const { error: insertError } = await supabase
          .from('brand_knowledge')
          .insert({
            brand: form.getValues("brand"),
            content: formattedContent,
            type: 'website_content'
          });

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Website content analyzed and stored successfully",
        });
      } else {
        throw new Error("Failed to crawl website");
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: "Failed to analyze website content",
        variant: "destructive",
      });
    } finally {
      setIsCrawling(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    toast({
      title: "Uploading...",
      description: "Brand documents are being uploaded"
    });

    try {
      for (const file of Array.from(files)) {
        const fileName = file.name.replace(/[^\x00-\x7F]/g, '');
        const fileExt = fileName.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('brand_documents')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        setUploadedFiles(prev => [...prev, { name: fileName, path: filePath }]);
      }

      toast({
        title: "Success",
        description: "Documents uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Error uploading documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('brand_documents')
        .remove([filePath]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(file => file.path !== filePath));
      toast({
        title: "Success",
        description: "File removed successfully",
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Error",
        description: "Error removing file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter project title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="brand"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand</FormLabel>
            <FormControl>
              <Input placeholder="Enter brand name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand Website</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://example.com" 
                  {...field} 
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={handleWebsiteCrawl}
                disabled={isCrawling || !field.value}
              >
                {isCrawling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                Analyze
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe your project" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="objectives"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Objectives</FormLabel>
            <FormControl>
              <Textarea placeholder="What are your project objectives?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="target_audience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Audience</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe your target audience" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="budget"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Budget</FormLabel>
            <FormControl>
              <Input placeholder="Enter project budget" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="timeline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timeline</FormLabel>
            <FormControl>
              <Input placeholder="Enter project timeline" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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

        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file) => (
              <div key={file.path} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.path)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
