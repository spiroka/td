import { Actor, createActor, StateValueFrom } from 'xstate';

import { gameMachine } from './game-machine';
import { Creep } from './creep';
import { CreepType, TDMap } from './types';
import { levels } from './levels';
import { spawnCreep } from './creeps';
import { ticker } from './utils';

export class Game {
  public creeps: Creep[] = [];
  public map: TDMap;
  public state: StateValueFrom<typeof gameMachine>;

  private actor: Actor<typeof gameMachine>;
  private creepTicker: ReturnType<typeof ticker>;

  constructor(map: TDMap) {
    this.map = map;
    this.creepTicker = ticker(() => {
      for (let creep of this.creeps) {
        if (creep.state === 'ready') {
          creep.begin();
          break;
        }
      }
    }, 1000);
    this.actor = createActor(gameMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;

    this.actor.subscribe(({ value }) => {
      this.state = value;
    });
  }

  public update(delta: number) {
    this.creeps.forEach(creep => creep.update(delta, this));
    this.creepTicker.update(delta);
  }

  public start() {
    const levelConfig = levels.shift();

    if (levelConfig) {
      this.creeps = Object.entries(levelConfig.creeps)
        .flatMap(([type, count]) => {
          let creeps = [];

          for (let i = 0; i < count; i++) {
            creeps.push(spawnCreep(this.map.start, type as CreepType));
          }

          return creeps;
        });
    }
    this.actor.send({ type: 'game.start' });
  }

  public pause() {
    this.actor.send({ type: 'game.pause' });
  }

  public play() {
    this.actor.send({ type: 'game.play' });
  }
}
