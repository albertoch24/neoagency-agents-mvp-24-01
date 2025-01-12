import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import FirecrawlApp from '@mendable/firecrawl-js';

interface WebsiteCrawlerProps {
  form: UseFormReturn<any>;
}

export const WebsiteCrawler = ({ form }: WebsiteCrawlerProps) => {
  const [isCrawling, setIsCrawling] = useState(false);

  const handleWebsiteCrawl = async () => {
    const websiteUrl = form.getValues("website");
    if (!websiteUrl) {
      toast("Error", {
        description: "Please enter a website URL first",
        variant: "destructive",
      });
      return;
    }

    setIsCrawling(true);
    toast("Crawling website", {
      description: "Please wait while we analyze the brand website...",
    });

    try {
      const { data: { secret } } = await supabase
        .from('secrets')
        .select('secret')
        .eq('name', 'FIRECRAWL_API_KEY')
        .single();

      if (!secret) {
        toast("Error", {
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

        const { error: insertError } = await supabase
          .from('brand_knowledge')
          .insert({
            brand: form.getValues("brand"),
            content: formattedContent,
            type: 'website_content'
          });

        if (insertError) throw insertError;

        toast("Success", {
          description: "Website content analyzed and stored successfully",
        });
      } else {
        throw new Error("Failed to crawl website");
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast("Error", {
        description: "Failed to analyze website content",
        variant: "destructive",
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