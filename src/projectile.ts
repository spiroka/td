import { Actor, createActor, StateValueFrom } from 'xstate';

import projectileMachine from './projectile-machine';
import { Creep } from './creep';
import { Game } from './game';
import { CreepEffect } from './types';
import { getDistance } from './utils';
import { returnProjectile } from './projectiles';

export class Projectile {
  public x: number = 0;
  public y: number = 0;
  public state: StateValueFrom<typeof projectileMachine>;

  private actor: Actor<typeof projectileMachine>;
  private target: Creep | null = null;
  private damage: number = 0;
  private effect?: CreepEffect;

  constructor() {
    this.actor = createActor(projectileMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;
    this.actor.subscribe(({ context, value }) => {
      this.x = context.x;
      this.y = context.y;
      this.target = context.target;
      this.damage = context.damage;
      this.effect = context.effect;
      this.state = value;
    });
  }

  public launch = (x: number, y: number, target: Creep, damage: number, effect?: CreepEffect) => {
    this.actor.send({ type: 'projectile.launch', x, y, target, damage, effect });
  };

  public update = (delta: number, game: Game) => {
    if (getDistance(this, this.target!) < 0.2) {
      this.target?.takeDamage(this.damage);
      if (this.effect) {
        this.target?.applyEffect(this.effect);
      }

      returnProjectile(this);

      return;
    }

    this.actor.send({ type: 'projectile.update', delta, game });
  };

  public reset = () => {
    this.actor.send({ type: 'projectile.reset' });
  };
}
