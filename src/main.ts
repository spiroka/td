import { generateMap } from './map-generator';
import { initCreeps } from './creeps';
import { Game } from './game';
import { UI } from './ui';
import { EmojiRenderer } from './emoji-renderer';
import { initTowers } from './towers';
import { Shop } from './shop';
import { initProjectiles } from './towers';

let game: Game;
let renderer = new EmojiRenderer();
let ui: UI;
let shop: Shop;

async function init(onProgress: (progress: string) => void) {
  onProgress('Generating map...');
  const map = await generateMap();

  onProgress('Spawning creeps...');
  await initCreeps();

  onProgress('Building towers...');
  initTowers();

  onProgress('Launching projectiles...');
  await initProjectiles();

  game = new Game(map);
  shop = new Shop(game);

  onProgress('Initializing renderer...');
  await renderer.init(game);

  onProgress('Initializing UI...');
  ui = new UI(game, shop);
}

let prevTimestamp = 0;
function gameLoop(timestamp: number) {
  const delta = timestamp - prevTimestamp;

  renderer.render(game, delta);
  if (game.state === 'playing') {
    game.update(delta);
  }
  prevTimestamp = timestamp;

  requestAnimationFrame(gameLoop);
}

function renderLoadingProgress(progress: string) {
  document.getElementById('loader')!.innerText = progress;
}

async function main() {
  await init(renderLoadingProgress);
  document.getElementById('loader')!.remove();
  requestAnimationFrame(gameLoop);
}

main();
