import { assign, enqueueActions, setup } from 'xstate';

import { CreepType, Point } from './types';
import { getDistance } from './utils';
import { Game } from './game';

const defaultContext = {
  x: 0,
  y: 0,
  type: 'slow' as CreepType,
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
      { type: 'creep.reset' } |
      { type: 'creep.kill' };
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
            velocity: event.creepType === 'slow' ? 1 : 2,
            health: event.creepType === 'slow' ? 100 : 50
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

            if (getDistance(self, game.map.end) < 0.5) {
              game.creepEnter();
            }

            const newPosition = calculateNewPosition(self, path, delta, self.velocity);

            return {
              x: newPosition.x,
              y: newPosition.y
            };
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
        'creep.kill': 'dead'
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

export default creepMachine;
