import { supabase } from "@/integrations/supabase/client";
import FirecrawlApp from '@mendable/firecrawl-js';

export const crawlWebsite = async (websiteUrl: string, brand: string, briefId?: string) => {
  try {
    // Get Firecrawl API key from secrets
    const { data: { secret } } = await supabase
      .from('secrets')
      .select('secret')
      .eq('name', 'FIRECRAWL_API_KEY')
      .single();

    if (!secret) {
      throw new Error('Firecrawl API key not configured');
    }

    // Initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey: secret });
    
    // Crawl website
    const response = await firecrawl.crawlUrl(websiteUrl, {
      limit: 100,
      scrapeOptions: {
        formats: ['markdown', 'html'],
      }
    });

    if (!response.success) {
      throw new Error('Failed to crawl website');
    }

    // Format content from crawled pages
    const websiteContent = response.data
      .map((doc: any) => `
        URL: ${doc.url}
        Title: ${doc.title}
        Content:
        ${doc.content}
        ---
      `)
      .join('\n\n');

    // Process content with LangChain
    const { error: processError } = await supabase.functions.invoke(
      'process-website-content',
      {
        body: { 
          websiteContent,
          brand,
          briefId
        }
      }
    );

    if (processError) {
      throw processError;
    }

    return {
      success: true,
      message: 'Website content processed successfully'
    };

  } catch (error) {
    console.error('Error in crawlWebsite:', error);
    throw error;
  }
};