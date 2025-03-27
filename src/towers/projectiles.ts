import { Creep } from '../creeps';
import { Projectile } from './projectile';
import { CreepEffect } from '../types';
import { batchProcess } from '../utils';

let projectiles: Projectile[] = [];

export async function initProjectiles() {
  projectiles = new Array(500).fill(undefined);

  return batchProcess(projectiles, (_, i) => projectiles[i] = new Projectile(), 10);
}

export function launchProjectile(x: number, y: number, target: Creep, damage: number, effect?: CreepEffect) {
  const projectile = projectiles.shift();

  projectile?.launch(x, y, target, damage, effect);

  return projectile!;
}

export function returnProjectile(projectile: Projectile) {
  projectile.reset();
  projectiles.push(projectile);
}
