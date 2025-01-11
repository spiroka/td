import { assign, enqueueActions, setup } from 'xstate';

import { Point } from './types';
import { Game } from './game';
import { Creep } from './creep';
import { getDistance, ticker } from './utils';

type Context = {
  x: number;
  y: number;
  damage: number;
  attackSpeed: number;
  range: number;
  target?: Creep;
  attackTicker?: ReturnType<typeof ticker>;
};

export const towerMachine = setup({
  types: {} as {
    events:
      { type: 'tower.place'; tile: Point } |
      { type: 'tower.update'; delta: number; game: Game } |
      { type: 'tower.attack'; target: Creep } |
      { type: 'tower.targetLost' };
    context: Context;
  }
}).createMachine({
  initial: 'idle',
  context: {
    x: 0,
    y: 0,
    damage: 20,
    attackSpeed: 0.5,
    range: 5
  },
  states: {
    idle: {
      on: {
        'tower.place': {
          target: 'ready',
          actions: assign(({ event }) => ({
            x: event.tile.x,
            y: event.tile.y
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
        }
      }
    },
    attacking: {
      entry: assign(({ context }) => ({
        attackTicker: ticker(() => {
          context.target?.takeDamage(context.damage);
        }, context.attackSpeed / 1 * 1000)
      })),
      on: {
        'tower.update': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            const distance = getDistance(context, context.target!);

            if (distance > context.range || context.target?.state !== 'creeping') {
              enqueue.raise({ type: 'tower.targetLost' });
            } else {
              context.attackTicker?.update(event.delta);
            }
          })
        },
        'tower.targetLost': {
          target: 'ready',
          actions: assign({
            target: undefined,
            attackTicker: undefined
          })
        }
      }
    }
  }
});
