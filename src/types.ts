import { Game } from './game';

export type Point = {
  x: number;
  y: number;
}

export type Tile = {
  type: 'path' | 'terrain';
} & Point;

export type TDMap = {
  start: Tile;
  end: Tile;
  path: Tile[];
  tiles: Tile[][];
};

export type Renderer = {
  init: (game: Game) => Promise<void>;
  render: (game: Game, delta: number) => void;
};

export type CreepType = 'slow' | 'fast';
