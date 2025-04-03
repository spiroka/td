import { assign, enqueueActions, setup } from 'xstate';

import type { Game } from '../game';
import type { Creep } from '../creeps';
import { CreepEffect } from '../types';
import { getDistance } from '../utils';

const defaultContext = {
  x: 0,
  y: 0,
  velocity: 10,
  target: null as Creep | null,
  effect: undefined as CreepEffect | undefined,
  damage: 0
};

const creepMachine = setup({
  types: {} as {
    events:
      { type: 'projectile.launch'; x: number; y: number; target: Creep; effect?: CreepEffect; damage: number } |
      { type: 'projectile.update'; delta: number; game: Game } |
      { type: 'projectile.reset' };
    context: typeof defaultContext;
  }
}).createMachine({
  initial: 'initial',
  context: defaultContext,
  states: {
    initial: {
      on: {
        'projectile.launch': {
          actions: assign(({ event }) => ({
            x: event.x,
            y: event.y,
            target: event.target,
            damage: event.damage,
            effect: event.effect
          })),
          target: 'moving'
        }
      }
    },
    moving: {
      on: {
        'projectile.update': {
          actions: enqueueActions(({ enqueue, event, context }) => {
            const d = getDistance(context, context.target!);

            if (d < 0.2) {
              context.target?.takeDamage(context.damage);

              if (context.effect) {
                context.target?.applyEffect(context.effect);
              }

              enqueue.raise({ type: 'projectile.reset' });

              return;
            }

            const t = (event.delta / 1000) * context.velocity / d;

            enqueue.assign({
              x: context.x + t * (context.target!.x - context.x),
              y: context.y + t * (context.target!.y - context.y)
            });
          })
        },
        'projectile.reset': 'initial'
      }
    }
  }
});

export default creepMachine;
