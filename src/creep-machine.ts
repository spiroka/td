import { assign, enqueueActions, setup } from 'xstate';

import { CreepEffect, CreepType, Point } from './types';
import { getDistance } from './utils';
import { Game } from './game';
import { isSlowEffect } from './creep-effects';

const defaultContext = {
  x: 0,
  y: 0,
  type: 'slow' as CreepType,
  isDead: true,
  effects: [] as CreepEffect[],
  velocity: 2,
  getVelocity() {
    const slowEffect = this.effects.find(isSlowEffect);

    return this.velocity * (slowEffect ? slowEffect.multiplier : 1);
  },
  health: 100,
  reward: 100
};

const creepMachine = setup({
  types: {} as {
    events:
      { type: 'creep.spawn'; tile: Point; creepType: CreepType } |
      { type: 'creep.update'; delta: number; game: Game } |
      { type: 'creep.begin' } |
      { type: 'creep.takeDamage'; damage: number } |
      { type: 'creep.reset' } |
      { type: 'creep.kill' } |
      { type: 'creep.addEffect', effect: CreepEffect } |
      { type: 'creep.removeEffect', effect: CreepEffect };
    context: typeof defaultContext;
  }
}).createMachine({
  initial: 'onBench',
  context: defaultContext,
  states: {
    onBench: {
      on: {
        'creep.spawn': {
          target: 'ready',
          actions: assign(({ event }) => ({
            x: event.tile.x,
            y: event.tile.y,
            type: event.creepType,
            isDead: false,
            ...creepTypeTemplates[event.creepType]
          }))
        }
      }
    },
    ready: {
      on: {
        'creep.begin': 'creeping'
      }
    },
    creeping: {
      on: {
        'creep.update': {
          actions: enqueueActions(({ enqueue, event, context: self }) => {
            const { game, delta } = event;
            const { path } = game.map;

            if (getDistance(self, game.map.end) < 0.5) {
              game.creepEnter();

              enqueue.raise({ type: 'creep.reset' });
            }

            const newPosition = calculateNewPosition(self, path, delta, self.getVelocity());

            enqueue.assign({
              x: newPosition.x,
              y: newPosition.y
            });
          })
        },
        'creep.takeDamage': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            if (context.health - event.damage <= 0) {
              enqueue.raise({ type: 'creep.kill' });
            } else {
              enqueue.assign({ health: context.health - event.damage });
            }
          })
        },
        'creep.addEffect': {
          actions: assign(({ event, context }) => ({
            effects: context.effects.concat(event.effect)
          }))
        },
        'creep.removeEffect': {
          actions: assign(({ event, context }) => ({
            effects: context.effects.filter((effect) => effect !== event.effect)
          }))
        },
        'creep.kill': 'dead',
        'creep.reset': 'onBench'
      }
    },
    dead: {
      on: {
        'creep.reset': 'onBench'
      }
    }
  }
});

function calculateNewPosition(currentPosition: Point, path: Point[], delta: number, velocity: number): Point {
  let distanceTraveled = (delta / 1000) * velocity;
  let offset;
  let nextTile;
  let currentTile;
  for (let i = 0; i < path.length; i++) {
    let distance = getDistance(path[i], currentPosition);
    if (distance <= 1) {
      let totalDistance = i + distance + distanceTraveled;
      let tilesTraveled = Math.floor(totalDistance);
      offset = totalDistance - tilesTraveled;
      currentTile = path[tilesTraveled];

      if (tilesTraveled >= path.length - 1) {
        return path[path.length - 1];
      }

      nextTile = path[tilesTraveled + 1];
      break;
    }
  }

  const diffX = nextTile!.x - currentTile!.x;
  const directionX = diffX >= 0 ? (diffX === 0 ? 0 : 1) : -1;
  const diffY = nextTile!.y - currentTile!.y;
  const directionY = diffY >= 0 ? (diffY === 0 ? 0 : 1) : -1;

  const distanceX = offset! * directionX;
  const distanceY = offset! * directionY;

  return {
    x: currentTile!.x + distanceX,
    y: currentTile!.y + distanceY
  };
}

const creepTypeTemplates: Record<CreepType, Partial<typeof defaultContext>> = {
  slow: {
    velocity: 1,
    health: 100,
    reward: 100
  },
  fast: {
    velocity: 2,
    health: 50,
    reward: 150
  }
};

export default creepMachine;
