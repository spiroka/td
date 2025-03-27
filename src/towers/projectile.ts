import { Actor, createActor, StateValueFrom } from 'xstate';

import projectileMachine from './projectile-machine';
import { Creep } from '../creeps';
import { Game } from '../game';
import { CreepEffect } from '../types';
import { returnProjectile } from './projectiles';

export class Projectile {
  public x: number = 0;
  public y: number = 0;
  public state: StateValueFrom<typeof projectileMachine>;

  private actor: Actor<typeof projectileMachine>;

  constructor() {
    this.actor = createActor(projectileMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;
    this.actor.subscribe(({ context, value }) => {
      this.x = context.x;
      this.y = context.y;

      if (this.state === 'moving' && value === 'initial') {
        returnProjectile(this);
      }

      this.state = value;
    });
  }

  public launch = (x: number, y: number, target: Creep, damage: number, effect?: CreepEffect) => {
    this.actor.send({ type: 'projectile.launch', x, y, target, damage, effect });
  };

  public update = (delta: number, game: Game) => {
    this.actor.send({ type: 'projectile.update', delta, game });
  };

  public reset = () => {
    this.actor.send({ type: 'projectile.reset' });
  };
}
