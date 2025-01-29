import type { Game } from './game';
import { config } from './config';
import { buildTower } from './towers';

import './styles/ui.css';

export class UI {
  private game: Game;
  private uiContainer = document.getElementById('ui');
  private overlayContainer = document.createElement('div');
  private currentState: Game['state'];
  private livesEl = document.createElement('div');

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

      this.currentState = state;
      if (game.lives != null) {
        this.livesEl.textContent = `${game.lives} lives left`;
      }
    });
    this.game = game;
    this.uiContainer?.classList.add('ui__container');
    this.overlayContainer.classList.add('overlay__container');
    this.livesEl.classList.add('ui__lives');
    this.uiContainer?.appendChild(this.livesEl);

    document.getElementById('game')?.appendChild(this.overlayContainer);

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
    this.overlayContainer.replaceChildren(pauseElement);
  }

  private play = () => {
    this.overlayContainer.replaceChildren();
  }

  private gameOver = () => {
    const gameOverElement = document.createElement('div');
    gameOverElement.classList.add('ui__text');
    const text = document.createElement('h1');
    text.textContent = 'GAME OVER';
    gameOverElement.appendChild(text);
    this.overlayContainer.replaceChildren(gameOverElement);
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
          el.remove();
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
    this.overlayContainer.replaceChildren(overlay);
  }
}
