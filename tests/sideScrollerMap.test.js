import { SideScrollerMapManager } from '../src/sideScrollerMap.js';
import { describe, test, assert } from './helpers.js';

describe('SideScrollerMapManager', () => {
  test('rooms are connected', () => {
    const mapManager = new SideScrollerMapManager(12345);
    const { width, height, tileTypes, map } = mapManager;
    let start = null;
    let floorCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] !== tileTypes.WALL) {
          if (!start) start = { x, y };
          floorCount++;
        }
      }
    }
    assert.ok(start, '맵에 시작 지점을 찾을 수 없습니다.');
    const visited = new Set();
    const queue = [start];
    visited.add(`${start.x},${start.y}`);
    let connectedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      connectedCount++;
      const { x, y } = current;
      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      ];
      for (const n of neighbors) {
        const key = `${n.x},${n.y}`;
        if (map[n.y] && map[n.y][n.x] !== tileTypes.WALL && !visited.has(key)) {
          visited.add(key);
          queue.push(n);
        }
      }
    }
    assert.strictEqual(connectedCount, floorCount, '맵이 고립된 공간을 포함합니다.');
  });
});
