import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet } from '../../../db';

const inputSchema = z.object({
  buildId: z.string().optional(),
  snapshotId: z.string().optional(),
}).optional();

export const getSnapshotBuildStatusProcedure = publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    const requestedBuildId = input?.buildId ?? input?.snapshotId ?? null;

    console.log('[BUILDS] router procedure registered: builds.getSnapshotBuildStatus');
    console.log('[BUILDS] getSnapshotBuildStatus called:', {
      requestedBuildId,
    });

    try {
      const lastSync = await dbGet('system_state', 'last_sync');
      const systemSnapshots = await dbGet('system_state', 'system_snapshots');
      const snapshots = Array.isArray(systemSnapshots?.snapshots)
        ? systemSnapshots.snapshots
        : [];
      const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
      const derivedSnapshotId = latestSnapshot?.snapshot_id ?? null;
      const derivedBuildId = requestedBuildId ?? lastSync?.syncId ?? derivedSnapshotId ?? 'local_snapshot_build';
      const status = lastSync?.completedAt ? 'COMPLETED' : 'PENDING';
      const updatedAt = lastSync?.completedAt ?? systemSnapshots?._updatedAt ?? new Date().toISOString();

      return {
        ok: true,
        build_id: derivedBuildId,
        snapshot_id: requestedBuildId ?? derivedSnapshotId,
        status,
        started_at: lastSync?.startedAt ?? updatedAt,
        completed_at: lastSync?.completedAt ?? null,
        updated_at: updatedAt,
      };
    } catch (error) {
      console.error('[BUILDS] getSnapshotBuildStatus error:', error);

      return {
        ok: true,
        build_id: requestedBuildId ?? 'local_snapshot_build',
        snapshot_id: requestedBuildId,
        status: 'PENDING' as const,
        started_at: new Date().toISOString(),
        completed_at: null,
        updated_at: new Date().toISOString(),
      };
    }
  });

export default getSnapshotBuildStatusProcedure;
