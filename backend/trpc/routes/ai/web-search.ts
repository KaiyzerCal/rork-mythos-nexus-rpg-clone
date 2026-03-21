import { publicProcedure } from '../../create-context';
import { z } from 'zod';

const inputSchema = z.object({
  query: z.string().min(2).max(300),
  num: z.number().int().min(1).max(10).optional().default(5),
});

type GoogleCustomSearchItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
};

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_SEARCH_KEY;
    const searchEngineId = process.env.EXPO_PUBLIC_GOOGLE_SEARCH_CX;

    console.log('[AI Web Search] Starting search:', {
      query: input.query,
      num: input.num,
      hasApiKey: Boolean(apiKey),
      hasSearchEngineId: Boolean(searchEngineId),
    });

    if (!apiKey || !searchEngineId) {
      return {
        ok: false,
        query: input.query,
        results: [],
        summary: '',
        error: 'Missing EXPO_PUBLIC_GOOGLE_SEARCH_KEY or EXPO_PUBLIC_GOOGLE_SEARCH_CX',
      };
    }

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', input.query);
    url.searchParams.set('num', String(input.num));
    url.searchParams.set('safe', 'active');

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Web Search] Google API error:', response.status, errorText);
        return {
          ok: false,
          query: input.query,
          results: [],
          summary: '',
          error: `Google search failed with status ${response.status}`,
        };
      }

      const data = (await response.json()) as { items?: GoogleCustomSearchItem[] };
      const results = Array.isArray(data.items)
        ? data.items
            .filter((item) => item.link && (item.title || item.snippet))
            .map((item, index) => ({
              id: `google-result-${index + 1}`,
              title: item.title ?? 'Untitled',
              link: item.link ?? '',
              snippet: item.snippet ?? '',
              source: item.displayLink ?? 'Google Search',
            }))
        : [];

      const summary = results
        .map((item, index) => `${index + 1}. ${item.title} (${item.source})\n${item.snippet}\nURL: ${item.link}`)
        .join('\n\n');

      console.log('[AI Web Search] Search complete:', {
        query: input.query,
        resultCount: results.length,
      });

      return {
        ok: true,
        query: input.query,
        results,
        summary,
        error: null,
      };
    } catch (error) {
      console.error('[AI Web Search] Unexpected search error:', error);
      return {
        ok: false,
        query: input.query,
        results: [],
        summary: '',
        error: error instanceof Error ? error.message : 'Unknown search error',
      };
    }
  });
