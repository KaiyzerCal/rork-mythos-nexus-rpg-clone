import type { InventoryItem, Currency } from '@/types/rpg';

export const STARTER_INVENTORY: InventoryItem[] = [
  {
    id: 'chaos-emerald-1',
    name: 'Chaos Emerald Fragment',
    description: 'A fragment of pure chaos energy',
    type: 'material',
    rarity: 'legendary',
    quantity: 1,
    effect: 'Used to unlock Dragon Gate transformations',
  },
  {
    id: 'lacrima-crystal-1',
    name: 'Lacrima Crystal',
    description: 'Crystallized magical energy',
    type: 'material',
    rarity: 'epic',
    quantity: 3,
    effect: 'Restore 50 energy to all systems',
  },
  {
    id: 'oken-core-fragment',
    name: 'Oken Core Fragment',
    description: 'Divine creation essence',
    type: 'artifact',
    rarity: 'mythic',
    quantity: 1,
    effect: 'Required for Regalia ignitions',
  },
];

export const INITIAL_CURRENCIES: Currency[] = [
  {
    name: 'Codex Points',
    amount: 1000,
    icon: '⚡',
  },
  {
    name: 'Soul Essence',
    amount: 500,
    icon: '🔥',
  },
  {
    name: 'Black Sun Tokens',
    amount: 10,
    icon: '☀️',
  },
];
