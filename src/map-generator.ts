import { config } from './config';
import { TDMap, Point, Tile } from './types';

function generateRandomMap() {
  const map = new Array(config.height)
    .fill(0)
    .map(() => new Array(config.width).fill(0));

  let obstacleCount = config.mapObstacleCount;

  const startY = Math.floor(Math.random() * config.height);
  const endY = Math.floor(Math.random() * config.height);

  map[startY][0] = -1;
  map[endY][config.width - 1] = -2;

  function getObsctacle() {
    const x = Math.floor(Math.random() * config.width);
    const y = Math.floor(Math.random() * config.height);

    return { x, y };
  }

  while (obstacleCount > 0) {
    const { x, y } = getObsctacle();
    map[y][x] = 1;
    obstacleCount--;
  }

  return { map, start: { x: 0, y: startY }, end: { x: config.width - 1, y: endY } };
}

type Node = Point & { parent?: Point, cost?: number };

function aStar(
  start: Point,
  goal: Point,
  isWalkable: (x: number, y: number) => boolean
) {
  const openSet: Node[] = [start];
  const closedSet = new Set();
  const gScore = new Map();
  const fScore = new Map();

  const nodeKey = (node: Point) => `${node.x},${node.y}`;

  const heuristic = (node: Point, goal: Point): number =>
    Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y); // Manhattan distance

  gScore.set(nodeKey(start), 0);
  fScore.set(nodeKey(start), heuristic(start, goal));

  while (openSet.length > 0) {
    // Get node with the lowest fScore
    openSet.sort((a, b) => (fScore.get(nodeKey(a)) || Infinity) - (fScore.get(nodeKey(b)) || Infinity));
    const current = openSet.shift()!;

    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruct path
      const path = [];
      let temp: Node | undefined = current;
      while (temp) {
        path.unshift({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path;
    }

    closedSet.add(nodeKey(current));

    // Explore neighbors
    const neighbors: Node[] = [
      { x: current.x + 1, y: current.y, cost: 1 },
      { x: current.x - 1, y: current.y, cost: 1 },
      { x: current.x, y: current.y + 1, cost: 1 },
      { x: current.x, y: current.y - 1, cost: 1 },
    ];

    for (const neighbor of neighbors) {
      const key = nodeKey(neighbor);
      if (!isWalkable(neighbor.x, neighbor.y) || closedSet.has(key)) {
        continue;
      }

      const tentativeGScore = (gScore.get(nodeKey(current)) || Infinity) + neighbor.cost;

      if (!openSet.find((node) => node.x === neighbor.x && node.y === neighbor.y)) {
        openSet.push(neighbor);
      } else if (tentativeGScore >= (gScore.get(key) || Infinity)) {
        continue;
      }

      // Update scores
      gScore.set(key, tentativeGScore);
      fScore.set(key, tentativeGScore + heuristic(neighbor, goal));
      neighbor.parent = current;
    }
  }

  return null; // No path found
}

export function generateMap(): Promise<TDMap> {
  return new Promise((resolve) => {
     asyncGenerateMap(resolve);
  });
}

function asyncGenerateMap(onSuccess: (map: TDMap) => void) {
  const result = generateRandomMap();
  const { start, end } = result;
  const map = result.map;
  const isWalkable = (x: number, y: number) => x >= 0 && x < config.width && y >= 0 && y < config.height && map[y][x] !== 1;
  const path = aStar(start, end, isWalkable);

  if (path) {
    let tiles = new Array(config.height).fill(0).map(() => new Array(config.width).fill(0));
    let pathTiles = path.map(({ x, y }) => {
      const pathTile = { x, y, type: 'path' };
      tiles[y][x] = pathTile;

      return pathTile;
    });

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        if (!tiles[y][x]) {
          const tile = { x, y, type: 'terrain' };
          tiles[y][x] = tile;
        }
      }
    }

    onSuccess({
      start: { ...start, type: 'path' },
      end: { ...end, type: 'path' },
      path: pathTiles as Tile[],
      tiles: tiles as Tile[][]
    });

    return;
  }

  requestAnimationFrame(() => asyncGenerateMap(onSuccess));
}
