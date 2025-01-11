import { CreepType } from './types';

type LevelConfig = {
  creeps: Record<CreepType, number>;
}

export const levels: LevelConfig[] = [
  {
    creeps: {
      slow: 3,
      fast: 2
    }
  }
];
