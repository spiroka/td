import { config } from './config';
import type { Creep } from './creeps';
import type { Game } from './game';
import type { CreepEffect, CreepType, Renderer, TowerType } from './types';
import type { Projectile } from './towers';
import type { Tower } from './towers';
import { el } from './utils';

import './styles/renderer.css';

export class EmojiRenderer implements Renderer {
  private container = el('div', null, 'creep-container');
  private projectileContainer = el('div', null, 'projectile-container');
  private particleContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private creepElements = new WeakMap<Creep, HTMLDivElement>();
  private towerElements = new WeakMap<Tower, HTMLDivElement>();
  private projectileElements = new WeakMap<Projectile, HTMLElement>();
  private projectiles = new Map<Tower, SVGPathElement>();
  private currentState?: Game['state'];

  public init = async (game: Game) => {
    this.currentState = game.state;

    game.onUpdate(({ state }) => {
      if (state === 'building' && this.currentState !== 'building') {
        this.container.querySelectorAll('.creep').forEach(el => el.remove());
        this.container.querySelectorAll('.tower').forEach(el => el.remove());

        for (let projectile of this.projectiles.values()) {
          projectile.setAttribute('d', '');
        }
      }

      this.currentState = state;
    });

    this.particleContainer.classList.add('particle-container');

    this.container.setAttribute('style', `
      --width: ${config.width};
      --height: ${config.height};
    `);
    document.getElementById('game')?.append(this.container, this.projectileContainer, this.particleContainer);

    this.renderMap(game);
  };

  public render = (game: Game, _delta: number) => {
    this.renderCreeps(game);
    this.renderTowers(game);
    this.renderProjectiles(game);
  };

  private renderCreeps = (game: Game) => {
    game.creeps.forEach((creep) => {
      let el = this.creepElements.get(creep);

      if (!['dead', 'creeping'].includes(creep.state)) {
        el?.remove();
        return;
      }

      if (!el) {
        el = document.createElement('div');
        el.classList.add('creep');

        this.container.appendChild(el);
        this.creepElements.set(creep, el);
      }

      if (creep.state === 'creeping') {
        el.textContent = creepTypeEmojiMap[creep.type];
      } else if (creep.state === 'dead') {
        el.textContent = '💀';
      }

      renderEffects(creep.effects, el);

      el.setAttribute('style', `
        top: calc(${(creep.y / config.height) * 100}% + 0.5em);
        left: calc(${(creep.x / config.width) * 100}% + 0.5em);
      `);
    });
  };

  private renderTowers = (game: Game) => {
    game.towers.forEach((tower) => {
      let el = this.towerElements.get(tower);

      if (!el) {
        el = document.createElement('div');
        el.classList.add('tower');
        el.textContent = towerTypeEmojiMap[tower.type];

        this.container.appendChild(el);
        this.towerElements.set(tower, el);
      }

      this.renderProjectiles(game);

      el.setAttribute('style', `
        grid-area: ${Math.floor(tower.y + 1)} / ${Math.floor(tower.x + 1)} / ${Math.floor(tower.y + 2)} / ${Math.floor(tower.x + 2)};
      `);
    });
  }

  private renderProjectiles = (game: Game) => {
    game.projectiles.forEach((projectile) => {
      if (projectile.state !== 'moving') {
        this.projectileElements.get(projectile)?.remove();
        return;
      }

      let proj = this.projectileElements.get(projectile);

      if (!proj) {
        proj = el('p', '.', 'projectile');
        this.projectileContainer.appendChild(proj);
        this.projectileElements.set(projectile, proj);
      }

      proj.setAttribute('style', `
        top: calc(${(projectile.y / config.height) * 100}% + 0.5em);
        left: calc(${(projectile.x / config.width) * 100}% + 0.5em);
      `);
    });
  };

  private renderMap = (game: Game) => {
    let mapTiles: HTMLDivElement[][] = [];
    for (let y = 0; y < config.height; y++) {
      mapTiles[y] = [];
    }

    const { tiles } = game.map;

    tiles.flat().forEach(({ x, y, type }) => {
      let tile = document.createElement('div');
      tile.setAttribute('style', `
        grid-area: ${y + 1} / ${x + 1} / ${y + 2} / ${x + 2};
      `);

      tile.classList.add(type === 'terrain' ? 'terrain' : 'path');

      if (type === 'terrain' && Math.random() > 0.7) {
        tile.textContent = '🌲';
      }

      this.container.appendChild(tile);
      mapTiles[y][x] = tile;
    });
  }
}

const creepTypeEmojiMap: Record<CreepType, string> = {
  slow: '🐌',
  fast: '🐇'
};

const towerTypeEmojiMap: Record<TowerType, string> = {
  basic: '🔫',
  ice: '🧊'
};

const effectClassMap: Record<CreepEffect['type'], string> = {
  slow: 'creep--slowed'
};

function renderEffects(effects: CreepEffect[], el: HTMLElement) {
  Object.values(effectClassMap).forEach((className) => {
    el.classList.remove(className);
  });

  effects.forEach((effect) => {
    el.classList.add(effectClassMap[effect.type]);
  });
}
