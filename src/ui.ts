import { Game } from './game';

export class UI {
  private game: Game;
  private container = document.createElement('div');

  constructor(game: Game) {
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
        this.pause();
      }

      if (e.key === ' ' && this.game.state === 'paused') {
        this.play();
      }
    });
  }

  private pause = () => {
    this.game.pause();
    const pauseElement = document.createElement('h1');
    pauseElement.textContent = 'PAUSED';
    this.container.replaceChildren(pauseElement);
  }

  private play = () => {
    this.game.play();
    this.container.replaceChildren();
  }
}
