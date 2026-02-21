import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet, dbList } from '../../../db';

const inputSchema = z.object({
  scope: z.string().optional().default('global'),
});

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    console.log('[MEMORY] Fetching global memory:', { scope: input.scope });

    try {
      const memoryData = await dbGet('memory_store', `scope_${input.scope}`);

      if (memoryData && memoryData.facts) {
        console.log('[MEMORY] Found stored memory:', {
          facts: memoryData.facts?.length || 0,
          preferences: memoryData.preferences?.length || 0,
          arcs: memoryData.arcs?.length || 0,
        });
        return {
          facts: memoryData.facts || [],
          preferences: memoryData.preferences || [],
          arcs: memoryData.arcs || [],
          last_updated: memoryData._updatedAt || new Date().toISOString(),
        };
      }

      const factsList = await dbList(`memory_facts_${input.scope}`);
      if (factsList.length > 0) {
        console.log('[MEMORY] Found', factsList.length, 'individual facts');
        return {
          facts: factsList,
          preferences: [],
          arcs: [],
          last_updated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('[MEMORY] Error fetching from DB:', error);
    }

    console.log('[MEMORY] No stored memory found, returning empty');
    return {
      facts: [],
      preferences: [],
      arcs: [],
      last_updated: new Date().toISOString(),
    };
  });
