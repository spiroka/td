import { config } from './config';
import { Creep } from './creep';
import { Game } from './game';
import { Tower } from './tower';
import { Renderer } from './types';

export class EmojiRenderer implements Renderer {
  private container = document.createElement('div');
  private creepElements = new WeakMap<Creep, HTMLDivElement>();
  private towerElements = new WeakMap<Tower, HTMLDivElement>();

  public init = async (game: Game) => {
    this.container.setAttribute('style', `
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(${config.width}, 1fr);
      grid-template-rows: repeat(${config.height}, 1fr);
    `);
    document.getElementById('game')?.appendChild(this.container);

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

        this.container.appendChild(el);
        this.creepElements.set(creep, el);
      }

      if (creep.state === 'creeping') {
        el.textContent = creep.type === 'slow' ? '🐌' : '🐇';
      } else if (creep.state === 'dead') {
        el.textContent = '💀';
      }

      el.setAttribute('style', `
        grid-area: ${Math.floor(creep.y + 1)} / ${Math.floor(creep.x + 1)} / ${Math.floor(creep.y + 2)} / ${Math.floor(creep.x + 2)};
        display: flex;
        align-items: center;
        justify-content: center;
      `);
    });
  };

  private renderTowers = (game: Game) => {
    game.towers.forEach((tower) => {
      let el = this.towerElements.get(tower);

      if (!el) {
        el = document.createElement('div');
        el.textContent = '🔫';
        this.container.appendChild(el);
        this.towerElements.set(tower, el);
      }

      el.setAttribute('style', `
        grid-area: ${Math.floor(tower.y + 1)} / ${Math.floor(tower.x + 1)} / ${Math.floor(tower.y + 2)} / ${Math.floor(tower.x + 2)};
        display: flex;
        align-items: center;
        justify-content: center;
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
