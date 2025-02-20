import { Game } from './game';
import { unlockTower } from './towers';

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
  private shopUl = document.createElement('ul')!;
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
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = item.name;
      const buyBtn = document.createElement('button');
      buyBtn.textContent = 'Buy';

      buyBtn.addEventListener('click', () => {
        item.onBuy();
        this.renderShop();
        this.purchaseCallbacks.forEach((cb) => cb());
        this.game.spendMoney(item.price);
      });

      if (!item.available || this.game.money < item.price) {
        buyBtn.disabled = true;
      }

      li.append(name, buyBtn);

      return li;
    });

    this.shopUl.replaceChildren(...items);
  }
}
