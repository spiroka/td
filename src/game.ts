import { Actor, createActor, StateValueFrom } from 'xstate';

import type { TDMap } from './types';
import type { Creep } from './creep';
import type { Tower } from './tower';
import { gameMachine } from './game-machine';

export class Game {
  public map: TDMap;
  public creeps: Creep[] = [];
  public towers: Tower[] = [];
  public state: StateValueFrom<typeof gameMachine>;
  public lives?: number;

  private actor: Actor<typeof gameMachine>;
  private updateCallbacks: Array<(game: Game) => void> = [];

  constructor(map: TDMap) {
    this.map = map;
    this.actor = createActor(gameMachine);
    this.actor.start();
    const { value: state, context: { lives } } = this.actor.getSnapshot();
    this.state = state;
    this.lives = lives;

    this.actor.subscribe(({ value, context }) => {
      this.state = value;
      this.creeps = context.creeps || [];
      this.towers = context.towers || [];
      this.lives = context.lives;

      this.updateCallbacks.forEach(cb => cb(this));
    });
  }

  public update(delta: number) {
    this.actor.send({ type: 'game.update', delta });
    this.creeps.forEach((creep) => creep.update(delta, this));
    this.towers.forEach((tower) => tower.update(delta, this));
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

  public creepEnter() {
    this.actor.send({ type: 'game.creepEnter' });
  }

  public onUpdate(cb: (game: Game) => void) {
    this.updateCallbacks.push(cb);
    cb(this);
  }

  public placeTower(tower: Tower) {
    this.actor.send({ type: 'game.placeTower', tower });
  }
}
