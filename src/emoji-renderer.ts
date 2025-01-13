import { config } from './config';
import { Creep } from './creep';
import { Game } from './game';
import { Renderer } from './types';

export class EmojiRenderer implements Renderer {
  private container = document.createElement('div');
  private creepElements = new WeakMap<Creep, HTMLDivElement>();

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

  public render = (game: Game, delta: number) => {
    this.renderCreeps(game, delta);
  };

  private renderCreeps = (game: Game, delta: number) => {
    game.creeps.forEach((creep) => {
      if (creep.state !== 'creeping') {
        return;
      }

      let el = this.creepElements.get(creep);

      if (!el) {
        el = document.createElement('div');
        el.textContent = creep.type === 'slow' ? '🐌' : '🐇';
        this.container.appendChild(el);
        this.creepElements.set(creep, el);
      }

      el.setAttribute('style', `
        grid-area: ${Math.floor(creep.y + 1)} / ${Math.floor(creep.x + 1)} / ${Math.floor(creep.y + 2)} / ${Math.floor(creep.x + 2)};
        display: flex;
        align-items: center;
        justify-content: center;
      `);
    })
  };

  private renderMap = (game: Game) => {
    let mapTiles: HTMLDivElement[][] = [];
    for (let y = 0; y < config.height; y++) {
      mapTiles[y] = [];
      for (let x = 0; x < config.width; x++) {
        let tile = document.createElement('div');
        tile.setAttribute('style', `
          grid-area: ${y + 1} / ${x + 1} / ${y + 2} / ${x + 2};
        `);
        mapTiles[y][x] = tile;
        this.container.appendChild(mapTiles[y][x]);
      }
    }

    const { start, end, path } = game.map;

    path.forEach((point) => mapTiles[point.y][point.x].style.backgroundColor = 'brown');
    mapTiles[start.y][start.x].style.backgroundColor = 'green';
    mapTiles[end.y][end.x].style.backgroundColor = 'red';
  }
}
