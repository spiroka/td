import { config } from './config';
import { Creep } from './creep';
import { Game } from './game';
import { Tower } from './tower';
import { Renderer } from './types';

export class EmojiRenderer implements Renderer {
  private container = document.createElement('div');
  private particleContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private creepElements = new WeakMap<Creep, HTMLDivElement>();
  private towerElements = new WeakMap<Tower, HTMLDivElement>();
  private projectiles = new Map<Tower, SVGPathElement>();
  private currentState?: Game['state'];
  private tileSize: number = 0;

  public init = async (game: Game) => {
    this.currentState = game.state;

    game.onUpdate(({ state }) => {
      if (state === 'initial' && this.currentState !== 'initial') {
        this.container.querySelectorAll('.creep').forEach(el => el.remove());
        this.container.querySelectorAll('.tower').forEach(el => el.remove());

        for (let projectile of this.projectiles.values()) {
          projectile.setAttribute('d', '');
        }
      }

      this.currentState = state;
    });

    this.container.setAttribute('style', `
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(${config.width}, 1fr);
      grid-template-rows: repeat(${config.height}, 1fr);
    `);
    this.particleContainer.setAttribute('style', `
      position: absolute;
      width: 100%;
      height: 100%;
    `);
    document.getElementById('game')?.appendChild(this.container);
    document.getElementById('game')?.appendChild(this.particleContainer);
    this.tileSize = this.container.getBoundingClientRect().width / config.width;

    this.renderMap(game);
  };

  public render = (game: Game, _delta: number) => {
    this.renderCreeps(game);
    this.renderTowers(game);
  };

  private renderCreeps = (game: Game) => {
    game.creeps.forEach((creep) => {
      let el = this.creepElements.get(creep);

      if (!el) {
        el = document.createElement('div');
        el.classList.add('creep');

        this.container.appendChild(el);
        this.creepElements.set(creep, el);
      }

      if (creep.state === 'creeping') {
        el.textContent = creep.type === 'slow' ? '🐌' : '🐇';
      } else if (creep.state === 'dead') {
        el.textContent = '💀';
      }

      el.setAttribute('style', `
        position: absolute;
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
        el.textContent = '🔫';

        this.container.appendChild(el);
        this.towerElements.set(tower, el);
      }

      if (tower.target) {
        let path = this.projectiles.get(tower);

        if (!path) {
          path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('stroke', 'white');
          path.setAttribute('stroke-dasharray', '1 10')
          this.particleContainer.appendChild(path);
          this.projectiles.set(tower, path);
        }

        path.setAttribute('d', `
          M ${tower.x * this.tileSize + this.tileSize / 2} ${tower.y * this.tileSize + this.tileSize / 2}
          L ${tower.target.x * this.tileSize + this.tileSize / 2} ${tower.target.y * this.tileSize + this.tileSize / 2}
        `);
      } else {
        let path = this.projectiles.get(tower);

        if (path) {
          path.setAttribute('d', '');
        }
      }

      el.setAttribute('style', `
        grid-area: ${Math.floor(tower.y + 1)} / ${Math.floor(tower.x + 1)} / ${Math.floor(tower.y + 2)} / ${Math.floor(tower.x + 2)};
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: green;
      `);
    });
  }

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
        display: flex;
        align-items: center;
        justify-content: center;
      `);
      tile.style.backgroundColor = type === 'path' ? 'brown' : 'green'

      if (type === 'terrain' && Math.random() > 0.7) {
        tile.textContent = '🌲';
      }

      this.container.appendChild(tile);
      mapTiles[y][x] = tile;
    });
  }
}
