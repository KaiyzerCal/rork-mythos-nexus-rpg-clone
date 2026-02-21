import { publicProcedure } from '../../create-context';

export default publicProcedure.query(() => {
  const startTime = Date.now();
  
  return {
    ok: true,
    uptime_s: process.uptime?.() || 0,
    timestamp: new Date().toISOString(),
    version: 'AXIS-IGNIS_v21.5',
    serverTime: startTime,
  };
});
