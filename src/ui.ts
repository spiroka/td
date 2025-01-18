import type { Game } from './game';
import { config } from './config';
import { buildTower } from './towers';

export class UI {
  private game: Game;
  private container = document.createElement('div');
  private currentState: Game['state'];

  constructor(game: Game) {
    this.currentState = game.state;

    game.onUpdate(({ state }) => {
      if (state === 'over' && this.currentState !== 'over') {
        this.gameOver();
      } else if (state === 'paused' && this.currentState !== 'paused') {
        this.pause();
      } else if (state === 'playing' && this.currentState !== 'playing') {
        this.play();
      } else if (state === 'building' && this.currentState !== 'building') {
        this.startBuilding();
      }
    });
    this.game = game;
    this.container.setAttribute('style', `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
    `);

    document.getElementById('game')?.appendChild(this.container);

    this.initKeyboard();
  }

  private initKeyboard = () => {
    document.addEventListener('keydown', e => {
      if (e.key === ' ' && this.game.state === 'initial') {
        this.game.start();
      }

      if (e.key === 'Escape' && this.game.state === 'playing') {
        this.game.pause();
      }

      if (e.key === ' ' && this.game.state === 'paused') {
        this.play();
      }
    });
  }

  private pause = () => {
    const pauseElement = document.createElement('h1');
    pauseElement.textContent = 'PAUSED';
    this.container.replaceChildren(pauseElement);
  }

  private play = () => {
    this.container.replaceChildren();
  }

  private gameOver = () => {
    const gameOverElement = document.createElement('h1');
    gameOverElement.textContent = 'GAME OVER';
    this.container.replaceChildren(gameOverElement);
  }

  private startBuilding = () => {
    const elements = [];
    const tiles = this.game.map.tiles.flat();

    for (let i = 0; i < tiles.length; i++) {
      let tile = tiles[i];
      const { x, y, type } = tile;

      if (type === 'terrain') {
        let el = document.createElement('div');
        el.setAttribute('style', `
          grid-area: ${y + 1} / ${x + 1} / ${y + 2} / ${x + 2};
          border: 1px solid white;
        `);
        el.onclick = () => {
          const tower = buildTower(tile);
          this.game.placeTower(tower);
        };
        elements.push(el);
      }
    }

    let overlay = document.createElement('div');
    overlay.setAttribute('style', `
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(${config.width}, 1fr);
      grid-template-rows: repeat(${config.height}, 1fr);
    `);

    overlay.append(...elements);
    this.container.replaceChildren(overlay);
  }
}
