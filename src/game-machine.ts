import { assign, enqueueActions, setup } from 'xstate';

import { Creep } from './creep';
import { CreepType, TDMap } from './types';
import { ticker } from './utils';
import { levels } from './levels';
import { spawnCreep } from './creeps';

type Context = {
  creeps?: Creep[];
  map?: TDMap;
  creepTicker?: ReturnType<typeof ticker>;
};

export const gameMachine = setup({
  types: {} as {
    events:
      { type: 'game.start'; map: TDMap } |
      { type: 'game.play' } |
      { type: 'game.pause' } |
      { type: 'game.update'; delta: number };
    context: Context;
  }
}).createMachine({
  id: 'game',
  initial: 'initial',
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
          target: 'playing'
        }
      }
    },
    paused: {
      on: {
        'game.play': 'playing'
      }
    },
    playing: {
      on: {
        'game.pause': 'paused',
        'game.update': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            context.creepTicker?.update(event.delta);
          })
        }
      }
    }
  }
});
