import { Creep } from './creeps';

export const Messages = {
  creepEntered: (creep: Creep) => ({ type: 'creepEntered', creep }) as const,
  pause: () => ({ type: 'pause' }) as const,
  start: () => ({ type: 'start' }) as const,
  play: () => ({ type: 'play' }) as const
} as const;

export type MessageType = keyof typeof Messages;

export type MessagePayloads = {
  [K in keyof typeof Messages]: Omit<typeof Messages[K], 'type'>;
};

export type Message<T extends MessageType> = {
  type: T;
} & Record<string, any>;
