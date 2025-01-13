import { Actor, createActor, StateValueFrom } from 'xstate';
import creepMachine from './creep-machine';
import { CreepType, Point } from './types';
import { Game } from './game';

export class Creep {
  public x: number = 0;
  public y: number = 0;
  public type: CreepType = 'slow';
  public state: StateValueFrom<typeof creepMachine>;

  private actor: Actor<typeof creepMachine>;

  constructor() {
    this.actor = createActor(creepMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;
    this.actor.subscribe(({ context, value }) => {
      this.x = context.x;
      this.y = context.y;
      this.type = context.type;
      this.state = value;
    });
  }

  public spawn = (tile: Point, creepType: CreepType) => {
    this.actor.send({ type: 'creep.spawn', tile, creepType });
  };

  public update = (delta: number, game: Game) => {
    this.actor.send({ type: 'creep.update', delta, game });
  };

  public begin = () => {
    this.actor.send({ type: 'creep.begin' });
  };

  public takeDamage = (damage: number) => {
    this.actor.send({ type: 'creep.takeDamage', damage });
  };
}
