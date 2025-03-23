import { assign, enqueueActions, setup } from 'xstate';

import type { Game } from './game';
import type { Creep } from './creep';
import { CreepEffect } from './types';

const defaultContext = {
  x: 0,
  y: 0,
  velocity: 1,
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
            const dirX = context.target!.x - context.x > 0 ? 1 : -1;
            const dirY = context.target!.y - context.y > 0 ? 1 : -1;
            const velX = (context.velocity * (event.delta / 1000)) * dirX;
            const velY = (context.velocity * (event.delta / 1000)) * dirY;

            enqueue.assign({
              x: context.x + velX,
              y: context.y + velY
            });
          })
        },
        'projectile.reset': 'initial'
      }
    }
  }
});

export default creepMachine;
