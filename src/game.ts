import { Actor, createActor, StateValueFrom } from 'xstate';

import { gameMachine } from './game-machine';
import { TDMap } from './types';
import { Creep } from './creep';

export class Game {
  public map: TDMap;
  public creeps: Creep[] = [];
  public state: StateValueFrom<typeof gameMachine>;

  private actor: Actor<typeof gameMachine>;

  constructor(map: TDMap) {
    this.map = map;
    this.actor = createActor(gameMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;

    this.actor.subscribe(({ value, context }) => {
      this.state = value;
      this.creeps = context.creeps || [];
    });
  }

  public update(delta: number) {
    this.actor.send({ type: 'game.update', delta });
    this.creeps.forEach((creep) => creep.update(delta, this));
  }

  public start() {
    this.actor.send({ type: 'game.start', map: this.map });
  }

  public pause() {
    this.actor.send({ type: 'game.pause' });
  }

  public play() {
    this.actor.send({ type: 'game.play' });
  }
}
