import { CreepType } from './types';

type LevelConfig = {
  creeps: Record<CreepType, number>;
}

export const levels: LevelConfig[] = [
  {
    creeps: {
      slow: 1,
      fast: 1
    }
  },
  {
    creeps: {
      slow: 5,
      fast: 3
    }
  }
];
