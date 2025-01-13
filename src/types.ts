import { Game } from './game';

export type Point = {
  x: number;
  y: number;
}

export type TDMap = {
  start: Point;
  end: Point;
  path: Point[];
};

export type Renderer = {
  init: (game: Game) => Promise<void>;
  render: (game: Game, delta: number) => void;
};

export type CreepType = 'slow' | 'fast';
