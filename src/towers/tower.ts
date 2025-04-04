import { Actor, createActor, StateValueFrom } from 'xstate';

import type { Point, TowerType } from '../types';
import type { Game } from '../game';
import { towerMachine } from './tower-machine'
import { Creep } from '../creeps';

export class Tower {
  public x: number = 0;
  public y: number = 0;
  public target?: Creep;
  public state: StateValueFrom<typeof towerMachine>;
  public type: TowerType = 'basic';

  private actor: Actor<typeof towerMachine>;

  constructor() {
    this.actor = createActor(towerMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;
    this.actor.subscribe(({ context, value }) => {
      this.x = context.x;
      this.y = context.y;
      this.target = context.target;
      this.state = value;
      this.type = context.type;
    });
  }

  public update = (delta: number, game: Game) => {
    this.actor.send({ type: 'tower.update', delta, game });
  };

  public place = (tile: Point, type: TowerType) => {
    this.actor.send({ type: 'tower.place', tile, towerType: type });
  };

  public reset = () => {
    this.actor.send({ type: 'tower.reset' });
  };
}
