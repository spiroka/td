import { batchProcess } from './utils';
import { Creep } from './creep';
import { CreepType, Point } from './types';

let creeps: Creep[];

export async function initCreeps() {
  creeps = new Array(200).fill(undefined);

  return batchProcess(creeps, (_, i) => creeps[i] = new Creep(), 10);
}

export function spawnCreep(tile: Point, type: CreepType) {
  const creep = creeps.shift();

  creep?.spawn(tile, type);

  return creep!;
}
