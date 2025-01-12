import { supabase } from "@/integrations/supabase/client";
import FirecrawlApp from '@mendable/firecrawl-js';

export const crawlWebsite = async (websiteUrl: string, brand: string) => {
  console.log('Starting website crawl:', websiteUrl);

  const { data, error } = await supabase
    .from('secrets')
    .select('secret')
    .eq('name', 'FIRECRAWL_API_KEY')
    .maybeSingle();

  if (error) {
    console.error('Error fetching Firecrawl API key:', error);
    throw new Error('Failed to fetch Firecrawl API key');
  }

  if (!data) {
    console.error('Firecrawl API key not found in secrets');
    throw new Error('Firecrawl API key not configured');
  }

  const firecrawl = new FirecrawlApp({ apiKey: data.secret });
  
  console.log('Initiating crawl for URL:', websiteUrl);
  
  const response = await firecrawl.crawlUrl(websiteUrl, {
    limit: 100,
    scrapeOptions: {
      formats: ['markdown', 'html'],
    }
  });

  if (!response.success) {
    console.error('Crawl failed:', response);
    throw new Error('Failed to crawl website');
  }

  console.log('Crawl successful:', response);

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

  return formattedContent;
};