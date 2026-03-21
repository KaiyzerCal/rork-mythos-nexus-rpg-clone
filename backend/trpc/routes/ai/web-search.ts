import { publicProcedure } from '../../create-context';
import { z } from 'zod';

const inputSchema = z.object({
  query: z.string().min(2).max(300),
  num: z.number().int().min(1).max(10).optional().default(5),
});

type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

type TavilySearchResponse = {
  results?: TavilySearchResult[];
  answer?: string;
  query?: string;
  response_time?: number;
};

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    console.log('[AI Web Search] Starting Tavily search:', {
      query: input.query,
      num: input.num,
      hasApiKey: Boolean(apiKey),
    });

    if (!apiKey) {
      return {
        ok: false,
        query: input.query,
        results: [],
        summary: '',
        error: 'Missing TAVILY_API_KEY',
      };
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: input.query,
          max_results: input.num,
          search_depth: 'basic',
          include_answer: true,
          include_raw_content: false,
          topic: 'general',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Web Search] Tavily API error:', response.status, errorText);
        return {
          ok: false,
          query: input.query,
          results: [],
          summary: '',
          error: `Tavily search failed with status ${response.status}`,
        };
      }

      const data = (await response.json()) as TavilySearchResponse;
      const results = Array.isArray(data.results)
        ? data.results
            .filter((item) => item.url && (item.title || item.content))
            .map((item, index) => {
              let source = 'Web';

              try {
                source = new URL(item.url ?? '').hostname.replace(/^www\./, '') || 'Web';
              } catch (error) {
                console.log('[AI Web Search] Failed to parse Tavily result URL:', error);
              }

              return {
                id: `tavily-result-${index + 1}`,
                title: item.title ?? 'Untitled',
                link: item.url ?? '',
                snippet: item.content ?? '',
                source,
                score: item.score ?? null,
              };
            })
        : [];

      const answerBlock = typeof data.answer === 'string' && data.answer.trim().length > 0
        ? `Tavily answer: ${data.answer.trim()}\n\n`
        : '';

      const summary = `${answerBlock}${results
        .map((item, index) => `${index + 1}. ${item.title} (${item.source})\n${item.snippet}\nURL: ${item.link}`)
        .join('\n\n')}`.trim();

      console.log('[AI Web Search] Tavily search complete:', {
        query: input.query,
        resultCount: results.length,
        hasAnswer: Boolean(data.answer),
      });

      return {
        ok: true,
        query: data.query ?? input.query,
        results,
        summary,
        error: null,
      };
    } catch (error) {
      console.error('[AI Web Search] Unexpected Tavily search error:', error);
      return {
        ok: false,
        query: input.query,
        results: [],
        summary: '',
        error: error instanceof Error ? error.message : 'Unknown search error',
      };
    }
  });
