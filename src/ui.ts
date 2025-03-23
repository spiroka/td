import { Actor, createActor, StateValueFrom } from 'xstate';

import type { Game } from './game';
import type { TowerType } from './types';
import type { Shop } from './shop';
import { config } from './config';
import { availableTowerTypes, buildTower } from './towers';
import { uiMachine } from './ui-machine';
import { el } from './utils';

import './styles/ui.css';

const towerToolbar = el(
  'div',
  [
    el('h2', 'Select tower to place:'),
    el('div', null, 'tower-toolbar__tower-container')
  ],
  'tower-toolbar'
);

export class UI {
  private game: Game;
  private uiContainer = document.getElementById('ui')!;
  private overlayContainer = el('div', null, 'overlay__container');
  private toolbarContainer = document.getElementById('toolbar')!;
  private gameState: Game['state'];
  private livesEl = el('div', null, 'ui__lives');
  private moneyEl = el('div', null, 'ui__money');
  private shopBtn = el('button', 'Shop 🏪', 'ui__shop');
  private actor: Actor<typeof uiMachine>;
  private state: StateValueFrom<typeof uiMachine>;
  private selectedTowerType?: TowerType;
  private towersLeft: number;

  constructor(game: Game, shop: Shop) {
    this.gameState = game.state;
    this.actor = createActor(uiMachine);
    this.actor.start();
    this.state = this.actor.getSnapshot().value;
    this.towersLeft = this.actor.getSnapshot().context.towersLeft;

    this.actor.subscribe(({ context, value }) => {
      if (value === 'building' && this.state !== 'building') {
        this.hideBuildingOverlay();
        this.showTowers();
      } else if (value === 'placingTower' && this.state !== 'placingTower') {
        this.showBuildingOverlay();
      }

      this.state = value;
      this.towersLeft = context.towersLeft;
      this.selectedTowerType = context.selectedTowerType;
    });

    game.onUpdate(({ state }) => {
      if (state === 'over' && this.gameState !== 'over') {
        this.gameOver();
      } else if (state === 'paused' && this.gameState !== 'paused') {
        this.pause();
      } else if (state === 'playing' && this.gameState !== 'playing') {
        this.play();
      } else if (state === 'building' && this.gameState !== 'building') {
        this.startBuilding();
      }

      this.gameState = state;
      if (game.lives != null) {
        const heart = el('span');
        heart.innerHTML = '&#9829;&nbsp;';
        const content = el('span', [
          heart,
          String(game.lives)
        ]);
        this.livesEl.replaceChildren(content);
      }

      this.moneyEl.textContent = `$${game.money}`;
    });
    this.game = game;
    this.uiContainer?.classList.add('ui__container');
    this.overlayContainer.classList.add('overlay__container');
    this.shopBtn.addEventListener('click', () => {
      shop.open();
    });
    this.uiContainer?.append(this.livesEl, this.moneyEl, this.shopBtn);

    document.getElementById('game')?.appendChild(this.overlayContainer);

    this.initKeyboard();

    shop.onItemPurchased(() => {
      if (['building', 'placeTower'].includes(this.state)) {
        this.showTowers();
      }
    });
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
  };

  private pause = () => {
    const pauseElement = el(
      'div',
      el('h1', 'PAUSED'),
      'ui__text'
    );
    this.overlayContainer.replaceChildren(pauseElement);
  };

  private play = () => {
    this.overlayContainer.replaceChildren();
  };

  private gameOver = () => {
    const gameOverElement = el(
      'div',
      el('h1', 'GAME OVER'),
      'ui__text'
    );
    this.overlayContainer.replaceChildren(gameOverElement);
  };

  private startBuilding = () => {
    this.actor.send({ type: 'ui.startBuilding' });
  };

  private showTowers = () => {
    this.toolbarContainer.replaceChildren(towerToolbar);
    const towersContainer = towerToolbar.querySelector('.tower-toolbar__tower-container')!;
    towersContainer.replaceChildren();

    availableTowerTypes.forEach((type) => {
      const towerEl = el('div', type, 'tower-toolbar__tower');
      towerEl.onclick = () => {
        this.actor.send({ type: 'ui.selectTower', towerType: type });
      };
      towersContainer.appendChild(towerEl);
    });
  };

  private showBuildingOverlay = () => {
    const elements = [];
    const tiles = this.game.map.tiles.flat();

    for (let i = 0; i < tiles.length; i++) {
      let tile = tiles[i];
      const { x, y, type } = tile;

      if (type === 'terrain') {
        let terrainEl = el('div');
        terrainEl.setAttribute('style', `
          grid-area: ${y + 1} / ${x + 1} / ${y + 2} / ${x + 2};
        `);
        terrainEl.onclick = () => {
          terrainEl.remove();
          const tower = buildTower(tile, this.selectedTowerType!);
          this.game.placeTower(tower);
          this.actor.send({ type: 'ui.placeTower' });

          if (this.towersLeft === 0) {
            this.actor.send({ type: 'ui.finishBuilding' });
            this.game.play();
          }
        };
        elements.push(terrainEl);
      }
    }

    let overlay = el('div', null, 'ui__building-overlay');
    overlay.setAttribute('style', `
      --width: ${config.width};
      --height: ${config.height};
    `);

    overlay.append(...elements);
    this.overlayContainer.replaceChildren(overlay);
  };

  private hideBuildingOverlay = () => {
    this.overlayContainer.replaceChildren();
  };
}
