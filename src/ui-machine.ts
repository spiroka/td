import { assign, enqueueActions, setup } from 'xstate';
import type { TowerType } from './types';

export const uiMachine = setup({
  types: {} as {
    events:
      { type: 'ui.startBuilding' } |
      { type: 'ui.selectTower', towerType: TowerType } |
      { type: 'ui.placeTower' } |
      { type: 'ui.beginLevel', towersLeft: number } |
      { type: 'ui.finishBuilding' };
    context: {
      selectedTowerType?: TowerType;
      towersLeft: number;
    }
  }
}).createMachine({
  id: 'ui',
  initial: 'initial',
  context: {
    towersLeft: 3
  },
  states: {
    initial: {
      entry: enqueueActions(({ enqueue }) => {
        enqueue.assign({ towersLeft: 3 })
      }),
      on: {
        'ui.startBuilding': 'building',
        'ui.beginLevel': {
          actions: assign(({ event: { towersLeft } }) => ({ towersLeft }))
        }
      }
    },
    building: {
      on: {
        'ui.selectTower': {
          target: 'placingTower',
          actions: assign(({ event: { towerType } }) => ({ selectedTowerType: towerType }))
        },
        'ui.finishBuilding': 'initial'
      }
    },
    placingTower: {
      on: {
        'ui.placeTower': {
          actions: assign(({ context }) => ({
            towersLeft: context.towersLeft! - 1
          })),
          target: 'building'
        }
      }
    },
  }
});
