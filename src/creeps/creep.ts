import { Actor, createActor, StateValueFrom } from 'xstate';
import creepMachine from './creep-machine';
import { CreepEffect, CreepType, Point } from '../types';
import { Game } from '../game';
import messageHub from '../message-hub';
import { Messages } from '../messages';

export class Creep {
  public x: number = 0;
  public y: number = 0;
  public type: CreepType = 'slow';
  public reward: number = 0;
  public state: StateValueFrom<typeof creepMachine>;
  public effects: CreepEffect[] = [];

  private deadCallbacks: Array<(creep: Creep) => void> = [];
  private actor: Actor<typeof creepMachine>;

  constructor() {
    this.actor = createActor(creepMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;
    this.actor.subscribe(({ context, value }) => {
      if (value === 'dead' && this.state !== 'dead') {
        this.deadCallbacks.forEach((cb) => cb(this));
        this.deadCallbacks = [];
      }

      if (value === 'entered' && this.state !== 'entered') {
        this.enter();
      }

      this.x = context.x;
      this.y = context.y;
      this.type = context.type;
      this.state = value;
      this.effects = context.effects;
      this.reward = context.reward;
    });
  }

  public spawn = (tile: Point, creepType: CreepType) => {
    this.deadCallbacks = [];
    this.actor.send({ type: 'creep.spawn', tile, creepType });
  };

  public update = (delta: number, game: Game) => {
    this.actor.send({ type: 'creep.update', delta, game });
    this.effects.forEach((effect) => effect.update(delta, this));
  };

  public begin = () => {
    this.actor.send({ type: 'creep.begin' });
  };

  public takeDamage = (damage: number) => {
    this.actor.send({ type: 'creep.takeDamage', damage });
  };

  public reset = () => {
    this.actor.send({ type: 'creep.reset' });
  };

  public applyEffect = (effect: CreepEffect) => {
    effect.apply(this);
  }

  public addEffect = (effect: CreepEffect) => {
    this.actor.send({ type: 'creep.addEffect', effect });
  };

  public removeEffect = (effect: CreepEffect) => {
    this.actor.send({ type: 'creep.removeEffect', effect });
  };

  public onDied = (cb: (creep: Creep) => void) => {
    this.deadCallbacks.push(cb);
  };

  private enter = () => {
    messageHub.emit(Messages.creepEntered(this));
    this.reset();
  };
}
