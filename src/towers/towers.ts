import messageHub from '../message-hub';
import type { Point, TowerType } from '../types';
import { Tower } from './tower';

let towers: Tower[];

export const availableTowerTypes: TowerType[] = [ 'basic' ];

export function initTowers() {
  const init = new Array(10).fill(undefined);
  towers = init.map(() => new Tower());
  messageHub.on('unlockTower', ({ towerType }) => unlockTower(towerType));
}

export function buildTower(tile: Point, type: TowerType) {
  const tower = towers.shift();

  tower?.place(tile, type);

  return tower!;
}

export function demolishTower(tower: Tower) {
  tower.reset();
  towers.push(tower);
}

export function unlockTower(type: TowerType) {
  availableTowerTypes.push(type);
}
