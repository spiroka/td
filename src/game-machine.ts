import { assign, enqueueActions, setup } from 'xstate';

import type { Creep } from './creep';
import type { CreepType, TDMap } from './types';
import type { Tower } from './tower';
import { ticker } from './utils';
import { levels } from './levels';
import { spawnCreep } from './creeps';

type Context = {
  creeps?: Creep[];
  towers?: Tower[];
  map?: TDMap;
  creepTicker?: ReturnType<typeof ticker>;
  lives: number;
};

export const gameMachine = setup({
  types: {} as {
    events:
      { type: 'game.start'; map: TDMap } |
      { type: 'game.play' } |
      { type: 'game.pause' } |
      { type: 'game.update'; delta: number } |
      { type: 'game.creepEnter' } |
      { type: 'game.over' } |
      { type: 'game.placeTower', tower: Tower } |
      { type: 'game.reset' };
    context: Context;
  }
}).createMachine({
  id: 'game',
  initial: 'initial',
  context: {
    lives: 1
  },
  states: {
    initial: {
      on: {
        'game.start': {
          actions: assign(({ event }) => {
            const levelConfig = levels.shift();
            let creeps = Object.entries(levelConfig!.creeps)
              .flatMap(([type, count]) => {
                let creepsArray = [];

                for (let i = 0; i < count; i++) {
                  creepsArray.push(spawnCreep(event.map.start, type as CreepType));
                }

                return creepsArray;
              });

            const creepTicker = ticker(() => {
              for (let creep of creeps) {
                if (creep.state === 'ready') {
                  creep.begin();
                  break;
                }
              }
            }, 1000);

            return { map: event.map, creeps, creepTicker };
          }),
          target: 'building'
        }
      }
    },
    paused: {
      on: {
        'game.play': 'playing'
      }
    },
    building: {
      on: {
        'game.placeTower': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            const towers = context.towers || [];
            towers.push(event.tower);

            enqueue.assign({ towers });

            if (towers.length === 3) {
              enqueue.raise({ type: 'game.play' });
            }
          })
        },
        'game.play': 'playing'
      }
    },
    playing: {
      on: {
        'game.pause': 'paused',
        'game.update': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            context.creepTicker?.update(event.delta);
            const roundWon = context.creeps?.every((creep) => creep.state === 'dead');

            if (roundWon) {
              enqueue.raise({ type: 'game.reset' });
            }
          })
        },
        'game.creepEnter': {
          actions: enqueueActions(({ context, enqueue }) => {
            const lives = context.lives! - 1;
            enqueue.assign({ lives });

            if (lives === 0) {
              enqueue.raise({ type: 'game.over' });
            }
          })
        },
        'game.over': 'over',
        'game.reset': 'initial'
      }
    },
    over: {}
  }
});
