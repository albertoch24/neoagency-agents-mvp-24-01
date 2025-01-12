import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { crawlWebsite } from "@/utils/websiteCrawler";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

interface WebsiteCrawlerProps {
  form: UseFormReturn<any>;
}

export const WebsiteCrawler = ({ form }: WebsiteCrawlerProps) => {
  const [isCrawling, setIsCrawling] = useState(false);
  const { briefId } = useParams();

  const handleWebsiteCrawl = async () => {
    const websiteUrl = form.getValues("website");
    const brand = form.getValues("brand");
    
    if (!websiteUrl) {
      toast("Please enter a website URL first", {
        description: "A valid URL is required",
        style: { backgroundColor: 'red', color: 'white' }
      });
      return;
    }

    if (!briefId) {
      toast.error("No brief ID found");
      return;
    }

    setIsCrawling(true);
    toast("Crawling website", {
      description: "Please wait while we analyze the brand website...",
    });

    try {
      console.log("Starting website crawl for brief:", briefId);
      
      // Fetch the brief data using maybeSingle() to handle the case where no brief is found
      const { data: briefData, error: briefError } = await supabase
        .from('briefs')
        .select('id, brand')
        .eq('id', briefId)
        .maybeSingle();

      if (briefError || !briefData) {
        throw new Error('Failed to fetch brief data');
      }

      const crawledContent = await crawlWebsite(websiteUrl, brand);
      console.log("Crawled content:", crawledContent);

      // Store the crawled content
      const { error: storageError } = await supabase
        .from('brand_knowledge')
        .insert({
          brief_id: briefId,
          brand: brand,
          content: crawledContent,
          type: 'website_content'
        });

      if (storageError) {
        console.error("Error storing crawled content:", storageError);
        throw new Error('Failed to store crawled content');
      }

      toast.success("Website content analyzed and stored successfully");
    } catch (error) {
      console.error('Error crawling website:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze website content";
      toast(errorMessage, {
        description: "Please try again later",
        style: { backgroundColor: 'red', color: 'white' }
      });
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <FormItem>
      <FormLabel>Brand Website</FormLabel>
      <div className="flex gap-2">
        <FormControl>
          <Input 
            type="url" 
            placeholder="https://example.com" 
            {...form.register("website")}
          />
        </FormControl>
        <Button
          type="button"
          variant="outline"
          onClick={handleWebsiteCrawl}
          disabled={isCrawling || !form.getValues("website")}
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
  );
};