import type { Game } from './game';
import { config } from './config';
import { buildTower } from './towers';

import './styles/ui.css';

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
    this.container.classList.add('ui__container');

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
        this.game.play();
      }
    });
  }

  private pause = () => {
    const pauseElement = document.createElement('div');
    pauseElement.classList.add('ui__text');
    const text = document.createElement('h1');
    text.textContent = 'PAUSED';
    pauseElement.appendChild(text);
    this.container.replaceChildren(pauseElement);
  }

  private play = () => {
    this.container.replaceChildren();
  }

  private gameOver = () => {
    const gameOverElement = document.createElement('div');
    gameOverElement.classList.add('ui__text');
    const text = document.createElement('h1');
    text.textContent = 'GAME OVER';
    gameOverElement.appendChild(text);
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
        `);
        el.onclick = () => {
          const tower = buildTower(tile);
          this.game.placeTower(tower);
        };
        elements.push(el);
      }
    }

    let overlay = document.createElement('div');
    overlay.classList.add('ui__building-overlay');
    overlay.setAttribute('style', `
      --width: ${config.width};
      --height: ${config.height};
    `);

    overlay.append(...elements);
    this.container.replaceChildren(overlay);
  }
}
