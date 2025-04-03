import { Creep } from './creeps';
import { TowerType } from './types';

const creepMessages = {
  creepEntered: (creep: Creep) => ({ type: 'creepEntered', creep }) as const,
  creepDied: (creep: Creep) => ({ type: 'creepDied', creep }) as const
};

const gameMessages = {
  pause: () => ({ type: 'pause' }) as const,
  start: () => ({ type: 'start' }) as const,
  play: () => ({ type: 'play' }) as const
};

const shopMessages = {
  unlockTower: (towerType: TowerType) => ({ type: 'unlockTower', towerType }) as const
};

export const Messages = {
  ...creepMessages,
  ...gameMessages,
  ...shopMessages
} as const;

export type MessageType = keyof typeof Messages;

export type MessagePayloads = {
  [K in keyof typeof Messages]: Omit<ReturnType<typeof Messages[K]>, 'type'>;
};

export type Message<T extends MessageType> = {
  type: T;
} & Record<string, any>;
