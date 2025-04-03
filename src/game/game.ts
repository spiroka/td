import { Actor, createActor, StateValueFrom } from 'xstate';

import type { TDMap } from '../types';
import type { Creep } from '../creeps';
import type { Tower, Projectile } from '../towers';
import { gameMachine } from './game-machine';
import messageHub from '../message-hub';

export class Game {
  public map: TDMap;
  public creeps: Creep[] = [];
  public towers: Tower[] = [];
  public projectiles: Projectile[] = [];
  public state: StateValueFrom<typeof gameMachine>;
  public lives?: number;
  public money: number;

  private actor: Actor<typeof gameMachine>;
  private updateCallbacks: Array<(game: Game) => void> = [];

  constructor(map: TDMap) {
    this.map = map;
    this.actor = createActor(gameMachine);
    this.actor.start();
    const { value: state, context: { lives, money } } = this.actor.getSnapshot();
    this.state = state;
    this.lives = lives;
    this.money = money;

    this.actor.subscribe(({ value, context }) => {
      this.state = value;
      this.creeps = context.creeps || [];
      this.towers = context.towers || [];
      this.projectiles = context.projectiles || [];
      this.lives = context.lives;
      this.money = context.money;

      this.updateCallbacks.forEach(cb => cb(this));
    });

    messageHub.on('creepEntered', this.creepEnter);
    messageHub.on('creepDied', ({ creep }) => this.creepDied(creep));
    messageHub.on('pause', this.pause);
    messageHub.on('start', this.start);
    messageHub.on('play', this.play);
  }

  public update = (delta: number) => {
    this.actor.send({ type: 'game.update', delta, game: this });
    this.projectiles.forEach((projectile) => projectile.update(delta, this));
    this.creeps.forEach((creep) => creep.update(delta, this));
    this.towers.forEach((tower) => tower.update(delta, this));
  };

  public start = () => {
    this.actor.send({ type: 'game.start', map: this.map });
  };

  public pause = () => {
    this.actor.send({ type: 'game.pause' });
  };

  public play = () => {
    this.actor.send({ type: 'game.play' });
  };

  public creepEnter = () => {
    this.actor.send({ type: 'game.creepEnter' });
  };

  public onUpdate = (cb: (game: Game) => void) => {
    this.updateCallbacks.push(cb);
    cb(this);
  };

  public placeTower = (tower: Tower) => {
    this.actor.send({ type: 'game.placeTower', tower });
  };

  public creepDied = (creep: Creep) => {
    this.actor.send({ type: 'game.creepDied', creep });
  };

  public spendMoney = (amount: number) => {
    this.actor.send({ type: 'game.spendMoney', amount });
  };

  public projectileLaunched = (projectile: Projectile) => {
    this.actor.send({ type: 'game.projectileLaunched', projectile });
  };
}
