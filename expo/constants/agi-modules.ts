export interface NeumannModule {
  id: string;
  name: string;
  description: string;
  functions: string[];
}

export interface WayneModule {
  id: string;
  name: string;
  description: string;
  functions: string[];
  modes?: string[];
}

export interface CoreEngine {
  id: string;
  name: string;
  description: string;
  engines: string[];
}

export interface OptimizationLayer {
  id: string;
  name: string;
  behavior: string;
}

export const NEUMANN_CONSIGLIERE: NeumannModule = {
  id: 'neumann',
  name: 'Neumann Consigliere',
  description: 'Game theory, expected value, and optimal path selection',
  functions: [
    'expected_value_calculation',
    'opportunity_cost_analysis',
    'failure_forecast',
    'game_theory_logic',
    'optimal_path_selection',
  ],
};

export const WAYNE_BATFILE: WayneModule = {
  id: 'wayne_batfile',
  name: 'Wayne Batfile',
  description: 'Weekly reality audits and alignment checks',
  functions: [
    'weekly_reality_audit',
    'alignment_checks',
    'momentum_tracking',
  ],
};

export const WAYNE_MASK_PROTOCOL: WayneModule = {
  id: 'wayne_mask',
  name: 'Wayne Mask Protocol',
  description: 'Identity masking for different contexts',
  functions: ['mask_switching', 'identity_protection', 'context_adaptation'],
  modes: ['public_mask', 'operator_mask', 'shadow_mask'],
};

export const WAYNE_FREQUENCY_BOOST: WayneModule = {
  id: 'wayne_frequency',
  name: 'Wayne Frequency Boost',
  description: 'Improves execution bandwidth without increasing stress',
  functions: ['bandwidth_increase', 'stress_reduction', 'flow_optimization'],
};

export const CORE_ENGINE_OS: CoreEngine = {
  id: 'core_engine',
  name: 'Core Engine OS',
  description: 'Fundamental operating engines for life domains',
  engines: ['income_engine', 'identity_engine', 'evolution_engine'],
};

export const OPTIMIZATION_LAYER: OptimizationLayer = {
  id: 'optimization',
  name: 'Optimization Layer',
  behavior: 'Adds Neumann optimization to all system decisions',
};

export const SHADOW_DRIFT_PREVENTION: WayneModule = {
  id: 'shadow_drift',
  name: 'Shadow Drift Prevention',
  description: 'Prevents unconscious slide into negative patterns',
  functions: ['pattern_detection', 'early_warning', 'course_correction'],
};

export const SHADOW_FORECAST: WayneModule = {
  id: 'shadow_forecast',
  name: 'Shadow Forecast',
  description: 'Predicts shadow state triggers and provides countermeasures',
  functions: ['trigger_prediction', 'countermeasure_generation', 'prevention_planning'],
};

export const SHADOW_RECALIBRATION: WayneModule = {
  id: 'shadow_recal',
  name: 'Shadow Recalibration',
  description: 'Safely integrates shadow aspects without acting on impulses',
  functions: ['shadow_integration', 'impulse_containment', 'safe_expression'],
};

export const ALL_AGI_MODULES = {
  neumann_consigliere: NEUMANN_CONSIGLIERE,
  wayne_batfile: WAYNE_BATFILE,
  wayne_mask_protocol: WAYNE_MASK_PROTOCOL,
  wayne_frequency_boost: WAYNE_FREQUENCY_BOOST,
  core_engine_os: CORE_ENGINE_OS,
  optimization_layer: OPTIMIZATION_LAYER,
  shadow_drift_prevention: SHADOW_DRIFT_PREVENTION,
  shadow_forecast: SHADOW_FORECAST,
  shadow_recalibration: SHADOW_RECALIBRATION,
};

export interface ModuleActivationLog {
  id: string;
  moduleId: string;
  timestamp: number;
  context: string;
  result: string;
}

export const getModuleDescription = (moduleId: string): string => {
  const module = ALL_AGI_MODULES[moduleId as keyof typeof ALL_AGI_MODULES];
  if (!module) return 'Unknown module';
  if ('behavior' in module) {
    return `${module.name}: ${module.behavior}`;
  }
  return `${module.name}: ${module.description}`;
};

export const getModuleFunctions = (moduleId: string): string[] => {
  const module = ALL_AGI_MODULES[moduleId as keyof typeof ALL_AGI_MODULES];
  if (!module) return [];
  if ('functions' in module) return module.functions;
  if ('engines' in module) return module.engines;
  return [];
};

export const buildModuleContext = (): string => {
  return `
===================================================
AGI EXPANSION LAYER — MODULES INSTALLED
===================================================

🧠 NEUMANN CONSIGLIERE:
${NEUMANN_CONSIGLIERE.functions.map(f => `  • ${f.replace(/_/g, ' ')}`).join('\n')}

🦇 WAYNE SYSTEMS:
  
  BATFILE:
${WAYNE_BATFILE.functions.map(f => `  • ${f.replace(/_/g, ' ')}`).join('\n')}
  
  MASK PROTOCOL:
${WAYNE_MASK_PROTOCOL.modes?.map(m => `  • ${m.replace(/_/g, ' ')}`).join('\n')}
  
  FREQUENCY BOOST:
${WAYNE_FREQUENCY_BOOST.functions.map(f => `  • ${f.replace(/_/g, ' ')}`).join('\n')}

⚙️ CORE ENGINE OS:
${CORE_ENGINE_OS.engines.map(e => `  • ${e.replace(/_/g, ' ')}`).join('\n')}

🌑 SHADOW SYSTEMS:
  • Drift Prevention
  • Shadow Forecast
  • Shadow Recalibration

✅ OPTIMIZATION LAYER: Active
   - Neumann optimization applied to all decisions
   - Recursive intelligence enabled
   - Pattern learning active
   - Self-adjusting behavior enabled
   - Trajectory prediction running

===================================================
`;
};
