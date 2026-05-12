export type Species = 'cat' | 'dog' | 'bunny';

export type GrowthStage = 1 | 2 | 3;

export interface PetMemory {
  summary: string;
  timestamp: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  coparent_id: string | null;
  name: string;
  species: Species;
  energy: number;
  affection: number;
  hunger: number;
  personality_summary: string;
  memory: PetMemory[];
  growth_stage: GrowthStage;
  interaction_count: number;
  last_interaction_at: string;
  created_at: string;
}

export interface PetStats {
  energy: number;
  affection: number;
  hunger: number;
}

export type MoodLabel = 'starving' | 'lonely' | 'tired' | 'happy' | 'content';

export function getMoodLabel(stats: PetStats): MoodLabel {
  const hunger = Number(stats.hunger);
  const affection = Number(stats.affection);
  const energy = Number(stats.energy);
  if (hunger < 30) return 'starving';
  if (affection < 30) return 'lonely';
  if (energy < 30) return 'tired';
  if (energy > 70 && affection > 70 && hunger > 70) return 'happy';
  return 'content';
}
