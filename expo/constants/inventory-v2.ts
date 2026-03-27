import type { InventoryItemV2 } from '@/types/rpg';

export const INITIAL_INVENTORY_V2: InventoryItemV2[] = [
  {
    id: 'hashira-wraps',
    slot: 'Arm',
    name: 'Hashira Wraps of Aevara Flame',
    tier: 'SS',
    description: 'Stabilizes Ki/Haki/Black Sun',
    effects: [{ label: 'Energy Control', value: 12, unit: '%' }],
  },
  {
    id: 'black-sun-crown',
    slot: 'Head',
    name: 'Crown of the Black Sun',
    tier: 'SSS',
    description: 'Law harmonization',
    effects: [{ label: 'Aura Stability', value: 18, unit: '%' }],
  },
  {
    id: 'axis-ignis-mantle',
    slot: 'Aura',
    name: 'Axis Ignis Mantle',
    tier: 'SSS',
    description: 'Play-state divinity',
    effects: [{ label: 'Flow Entry Speed', value: 22, unit: '%' }],
  },
];
