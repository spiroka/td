import { assign, enqueueActions, setup } from 'xstate';

import { CreepType, Point } from './types';
import { getDistance } from './utils';
import { Game } from './game';

const defaultContext = {
  x: 0,
  y: 0,
  isDead: true,
  velocity: 2,
  health: 100
};

const creepMachine = setup({
  types: {} as {
    events:
      { type: 'creep.spawn'; tile: Point; creepType: CreepType } |
      { type: 'creep.update'; delta: number; game: Game } |
      { type: 'creep.begin' } |
      { type: 'creep.takeDamage'; damage: number } |
      { type: 'creep.reset' };
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
            isDead: false,
            velocity: event.creepType === 'slow' ? 0.5 : 1
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
          actions: assign(({ event, context: self }) => {
            const { game, delta } = event;
            const { path } = game.map;
            const newPosition = calculateNewPosition({ x: self.x, y: self.y }, path, delta, self.velocity);

            return {
              x: newPosition.x,
              y: newPosition.y
            };
          })
        },
        'creep.takeDamage': {
          actions: enqueueActions(({ event, context, enqueue }) => {
            if (context.health - event.damage <= 0) {
              enqueue.raise({ type: 'creep.reset' });
            } else {
              enqueue.assign({ health: context.health - event.damage });
            }
          })
        },
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

export default creepMachine;
