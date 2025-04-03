import { CreepType } from './types';

type LevelConfig = {
  creeps: Record<CreepType, number>;
}

export const levels: LevelConfig[] = [
  {
    creeps: {
      slow: 6,
      fast: 15
    }
  },
  {
    creeps: {
      slow: 5,
      fast: 3
    }
  }
];
