import type { Creep } from './creep';
import type { CreepEffect, SlowEffect } from './types';

function noop() { }

export function slow(duration: number, multiplier: number): SlowEffect {
  return {
    type: 'slow',
    timeLeft: duration,
    multiplier,
    apply(creep: Creep) {
      const slowEffect = creep.effects.find(isSlowEffect);
      if (slowEffect && slowEffect.multiplier < multiplier) {
        creep.removeEffect(slowEffect);
        creep.addEffect(this);
      } else if (!slowEffect) {
        creep.addEffect(this);
      }
    },
    update(delta: number, creep: Creep) {
      this.timeLeft -= delta;

      if (this.timeLeft <= 0) {
        creep.removeEffect(this);
      }
    }
  };
}

export function isSlowEffect(effect: CreepEffect): effect is SlowEffect {
  return effect.type === 'slow';
}
