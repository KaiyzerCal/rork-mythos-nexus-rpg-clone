import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbSet, dbGet } from '../../../db';

const inputSchema = z.object({
  key: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.string(),
  scope: z.string(),
});

export default publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    console.log('[MEMORY] Upserting memory fact:', {
      key: input.key,
      scope: input.scope,
      confidence: input.confidence,
    });

    try {
      const factId = `${input.scope}_${input.key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      await dbSet(`memory_facts_${input.scope}`, factId, {
        key: input.key,
        value: input.value,
        confidence: input.confidence,
        source: input.source,
        scope: input.scope,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const storeData = await dbGet('memory_store', `scope_${input.scope}`);
      const existingFacts: any[] = storeData?.facts || [];
      const existingIdx = existingFacts.findIndex((f: any) => f.key === input.key);

      if (existingIdx >= 0) {
        existingFacts[existingIdx] = {
          ...existingFacts[existingIdx],
          value: input.value,
          confidence: input.confidence,
          source: input.source,
          updatedAt: new Date().toISOString(),
        };
      } else {
        existingFacts.push({
          id: factId,
          key: input.key,
          value: input.value,
          confidence: input.confidence,
          source: input.source,
          scope: input.scope,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await dbSet('memory_store', `scope_${input.scope}`, {
        facts: existingFacts,
        preferences: storeData?.preferences || [],
        arcs: storeData?.arcs || [],
      });

      console.log('[MEMORY] Fact upserted successfully:', input.key);
    } catch (error) {
      console.error('[MEMORY] Error upserting fact:', error);
    }

    return { ok: true };
  });
