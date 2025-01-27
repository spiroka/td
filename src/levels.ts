import { CreepType } from './types';

type LevelConfig = {
  creeps: Record<CreepType, number>;
}

export const levels: LevelConfig[] = [
  {
    creeps: {
      slow: 4,
      fast: 10
    }
  },
  {
    creeps: {
      slow: 5,
      fast: 3
    }
  }
];
