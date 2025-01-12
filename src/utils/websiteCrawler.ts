import { supabase } from "@/integrations/supabase/client";
import FirecrawlApp from '@mendable/firecrawl-js';

export const crawlWebsite = async (websiteUrl: string, brand: string) => {
  const { data: { secret } } = await supabase
    .from('secrets')
    .select('secret')
    .eq('name', 'FIRECRAWL_API_KEY')
    .single();

  if (!secret) {
    throw new Error('Firecrawl API key not configured');
  }

  const firecrawl = new FirecrawlApp({ apiKey: secret });
  const response = await firecrawl.crawlUrl(websiteUrl, {
    limit: 100,
    scrapeOptions: {
      formats: ['markdown', 'html'],
    }
  });

  if (!response.success) {
    throw new Error('Failed to crawl website');
  }

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
      brand,
      content: formattedContent,
      type: 'website_content'
    });

  if (insertError) throw insertError;

  return formattedContent;
};