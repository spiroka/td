import { config } from './config';
import { Creep } from './creeps';
import { Game } from './game';
import { Renderer, TDMap } from './types';

let canvas: HTMLCanvasElement = document.createElement('canvas');

async function init() {
  canvas.width = 500;
  canvas.height = 500;
  document.getElementById('game')?.appendChild(canvas);
}

function render(game: Game, delta: number) {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderMap(game.map, ctx);
  renderCreeps(game.creeps, ctx);
  renderFPS(delta, ctx);
}

function renderFPS(delta: number, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'black';
  ctx.font = '30px sans-serif';
  ctx.fillText(String(Math.floor(1000 / delta)), 50, 50);
}

function renderCreeps(creeps: Creep[], ctx: CanvasRenderingContext2D) {
  creeps.forEach((creep) => {
    if (creep.state !== 'creeping') {
      return;
    }

    ctx.fillStyle = 'pink';
    ctx.fillRect(creep.x * (500 / config.width), creep.y * (500 / config.height), 10, 10);
  });
}

function renderMap(map: TDMap, ctx: CanvasRenderingContext2D) {
  const { start, end, path } = map
  const nodeSize = 500 / config.width;
  ctx.fillStyle = 'green';
  path.forEach(point => ctx.fillRect(point.x * nodeSize, point.y * nodeSize, nodeSize, nodeSize));
  ctx.fillStyle = 'blue';
  ctx.fillRect(start.x * nodeSize, start.y * nodeSize, nodeSize, nodeSize);
  ctx.fillStyle = 'red';
  ctx.fillRect(end.x * nodeSize, end.y * nodeSize, nodeSize, nodeSize);
}

export const canvasRenderer: Renderer = {
  init,
  render
};
