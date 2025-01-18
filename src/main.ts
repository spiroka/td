import { generateMap } from './map-generator';
import { canvasRenderer } from './canvas-renderer';
import { initCreeps } from './creeps';
import { Game } from './game';
import { UI } from './ui';
import { Tower } from './tower';
import { EmojiRenderer } from './emoji-renderer';
import { initTowers } from './towers';

let game: Game;
let renderer = new EmojiRenderer();
let ui: UI;

async function init(onProgress: (progress: string) => void) {
  onProgress('Generating map...');
  const map = await generateMap();

  onProgress('Spawning creeps...');
  await initCreeps();

  onProgress('Building towers...');
  initTowers();

  game = new Game(map);

  onProgress('Initializing renderer...');
  await renderer.init(game);

  onProgress('Initializing UI...');
  ui = new UI(game);
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
