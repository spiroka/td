import { assign, enqueueActions, setup } from 'xstate';

import type { CreepEffect, Point, TowerType } from '../types';
import type { Game } from '../game';
import { Creep, slow } from '../creeps';
import { getDistance, ticker } from '../utils';
import { launchProjectile } from './projectiles';

type Context = {
  x: number;
  y: number;
  type: TowerType;
  damage: number;
  attackSpeed: number;
  range: number;
  target?: Creep;
  attackTicker?: ReturnType<typeof ticker>;
};

export const towerMachine = setup({
  types: {} as {
    events:
      { type: 'tower.place'; tile: Point, towerType: TowerType } |
      { type: 'tower.update'; delta: number; game: Game } |
      { type: 'tower.attack'; target: Creep } |
      { type: 'tower.targetLost' } |
      { type: 'tower.reset' };
    context: Context;
  }
}).createMachine({
  initial: 'idle',
  context: {
    x: 0,
    y: 0,
    type: 'basic',
    damage: 25,
    attackSpeed: 0.5,
    range: 10
  },
  states: {
    idle: {
      on: {
        'tower.place': {
          target: 'ready',
          actions: assign(({ event }) => ({
            x: event.tile.x,
            y: event.tile.y,
            type: event.towerType,
            ...towerTypeTemplates[event.towerType]
          }))
        }
      }
    },
    ready: {
      entry: assign({
        target: undefined
      }),
      on: {
        'tower.update': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            let creep = event.game.creeps
              .find((creep) => {
                if (creep.state !== 'creeping') {
                  return false;
                }

                const distance = getDistance(creep, context);
                if (distance <= context.range) {
                  return true;
                }

                return false;
              });

            if (creep) {
              enqueue.raise({ type: 'tower.attack', target: creep });
            }
          })
        },
        'tower.attack': {
          actions: assign(({ event }) => ({
            target: event.target
          })),
          target: 'attacking'
        },
        'tower.reset': 'idle'
      }
    },
    attacking: {
      entry: assign(({ context }) => ({
        attackTicker: ticker((game: Game) => {
          const effectCreator = effectCreatorByType[context.type];
          const projectile = launchProjectile(context.x, context.y, context.target!, context.damage, effectCreator?.());

          game.projectileLaunched(projectile);
        }, context.attackSpeed / 1 * 1000)
      })),
      on: {
        'tower.update': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            const distance = getDistance(context, context.target!);

            if (distance > context.range || context.target?.state !== 'creeping') {
              enqueue.raise({ type: 'tower.targetLost' });
            } else {
              context.attackTicker?.update(event.delta, event.game);
            }
          })
        },
        'tower.targetLost': {
          target: 'ready',
          actions: assign({
            target: undefined,
            attackTicker: undefined
          })
        },
        'tower.reset': 'idle'
      }
    }
  }
});

const towerTypeTemplates = {
  basic: {
    damage: 25,
    attackSpeed: 0.5,
    range: 10
  },
  ice: {
    damage: 10,
    attackSpeed: 0.5,
    range: 10
  }
};

const effectCreatorByType: Partial<Record<TowerType, () => CreepEffect>> = {
  ice: () => slow(2000, 0.5)
};
