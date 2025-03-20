import { Game } from './game';
import { unlockTower } from './towers';
import { el } from './utils';

const inventory = [
  {
    name: 'Unlock Ice Tower',
    price: 1000,
    available: true,
    onBuy() {
      this.available = false;
      unlockTower('ice');
    }
  }
];

export class Shop {
  private game: Game;
  private dialog = document.getElementById('shop')! as HTMLDialogElement;
  private shopUl = el('ul')!;
  private purchaseCallbacks: (() => void)[] = [];

  constructor(game: Game) {
    this.game = game;
    this.shopUl.classList.add('shop');
    this.dialog.append(this.shopUl);
  }

  public open = () => {
    this.renderShop();
    this.dialog.showModal();
  };

  public close = () => {
    this.dialog.close();
  };

  public onItemPurchased = (cb: () => void) => {
    this.purchaseCallbacks.push(cb);
  };

  private renderShop() {
    const items = inventory.map((item) => {
      const name = el('span', item.name);
      const price = el('span', `Price: ${item.price}`);
      const buyBtn = el('button', 'Buy') as HTMLButtonElement;
      const li = el('li', [name, price, buyBtn]);

      buyBtn.addEventListener('click', () => {
        item.onBuy();
        this.renderShop();
        this.purchaseCallbacks.forEach((cb) => cb());
        this.game.spendMoney(item.price);
      });

      if (!item.available || this.game.money < item.price) {
        buyBtn.disabled = true;
      }

      return li;
    });

    this.shopUl.replaceChildren(...items);
  }
}
