import { assign, enqueueActions, setup } from 'xstate';

import type { CreepType, TDMap } from '../types';
import type { Tower } from '../towers';
import { ticker } from '../utils';
import { levels } from '../levels';
import { returnCreep, spawnCreep, Creep } from '../creeps';
import { Projectile, returnProjectile, demolishTower } from '../towers';
import { Game } from './game';

type Context = {
  creeps?: Creep[];
  towers?: Tower[];
  map?: TDMap;
  creepTicker?: ReturnType<typeof ticker>;
  projectiles?: Projectile[];
  lives: number;
  money: number;
};

export const gameMachine = setup({
  types: {} as {
    events:
      { type: 'game.start'; map: TDMap } |
      { type: 'game.play' } |
      { type: 'game.pause' } |
      { type: 'game.update'; delta: number; game: Game } |
      { type: 'game.creepEnter' } |
      { type: 'game.over' } |
      { type: 'game.placeTower'; tower: Tower } |
      { type: 'game.reset' } |
      { type: 'game.creepDied'; creep: Creep } |
      { type: 'game.spendMoney'; amount: number } |
      { type: 'game.projectileLaunched'; projectile: Projectile };
    context: Context;
  }
}).createMachine({
  id: 'game',
  initial: 'initial',
  context: {
    lives: 10,
    money: 0
  },
  on: {
    'game.spendMoney': {
      actions: assign(({ context, event: { amount } }) => ({
        money: context.money - amount
      }))
    }
  },
  states: {
    initial: {
      on: {
        'game.start': {
          actions: assign(({ event }) => ({ map: event.map })),
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
          })
        },
        'game.play': {
          actions: assign(({ context: { map } }) => {
            const levelConfig = levels.shift();
            let creeps = Object.entries(levelConfig!.creeps)
              .flatMap(([type, count]) => {
                let creepsArray = [];

                for (let i = 0; i < count; i++) {
                  let creep = spawnCreep(map!.start, type as CreepType);
                  creepsArray.push(creep);
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
            }, 500);

            return { creeps, creepTicker, projectiles: [] };
          }),
          target: 'playing'
        }
      }
    },
    playing: {
      on: {
        'game.pause': 'paused',
        'game.update': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            context.creepTicker?.update(event.delta, event.game);
            const roundWon = context.creeps?.every((creep) => ['dead', 'onBench'].includes(creep.state));

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
        'game.creepDied': {
          actions: assign(({ event, context }) => {
            return {
              money: context.money + event.creep.reward
            };
          })
        },
        'game.over': 'over',
        'game.reset': {
          target: 'building',
          actions: assign(({ context: { creeps, towers, projectiles } }) => {
            creeps?.forEach(returnCreep);
            towers?.forEach(demolishTower);
            projectiles?.forEach(returnProjectile);

            return {
              creeps: [],
              towers: []
            };
          })
        },
        'game.projectileLaunched': {
          actions: assign(({ event: { projectile }, context }) => {
            const projectiles = context.projectiles || [];

            projectiles.push(projectile);

            return {
              projectiles: context.projectiles
            };
          })
        }
      }
    },
    over: {}
  }
});
