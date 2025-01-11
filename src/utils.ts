import { Point } from './types';

export async function batchProcess<T extends (param: any, index: number) => any>(
  items: Parameters<T>[0][],
  processFn: T,
  batchSize = 20
): Promise<void> {
  let resolve: () => void;

  const promise = new Promise<void>((res) => resolve = res);

  let batch: typeof items = [];
  for (let i = 0; i < items.length; i++) {
    const isLastBatch = i === items.length - 1;

    if (batch.push(items[i]) === batchSize || isLastBatch) {
      let batchToProcess = batch;

      requestAnimationFrame(() => {
        batchToProcess.forEach((param, idx) => {
          processFn(param, idx + (i - batchToProcess.length + 1));
        });

        if (isLastBatch) {
          resolve();
        }
      });

      batch = [];
    }
  }

  return promise;
}

export function getDistance(point1: Point, point2: Point) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ticker(fn: () => void, delay: number) {
  let elapsed = 0;

  return {
    update: (delta: number) => {
      elapsed += delta;
      if (elapsed >= delay) {
        fn();
        elapsed = 0;
      }
    }
  };
}
