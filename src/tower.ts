import { Actor, createActor, StateValueFrom } from 'xstate';

import type { Point } from './types';
import type { Game } from './game';
import { towerMachine } from './tower-machine'

export class Tower {
  public x: number = 0;
  public y: number = 0;
  public state: StateValueFrom<typeof towerMachine>;

  private actor: Actor<typeof towerMachine>;

  constructor() {
    this.actor = createActor(towerMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;
    this.actor.subscribe(({ context, value }) => {
      this.x = context.x;
      this.y = context.y;
      this.state = value;
    });
  }

  public update = (delta: number, game: Game) => {
    this.actor.send({ type: 'tower.update', delta, game });
  };

  public place = (tile: Point) => {
    this.actor.send({ type: 'tower.place', tile });
  };

  public reset = () => {
    this.actor.send({ type: 'tower.reset' });
  };
}
