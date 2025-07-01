import { MapManager } from './map.js';

/**
 * 넓고 사방이 벽으로 둘러싸인 전장 맵을 생성하는 매니저입니다.
 * 기본 MapManager의 미로 생성 로직을 오버라이드하여
 * 단순한 전장 형태를 제공합니다.
 */
export class BattlefieldMapManager extends MapManager {
    constructor(seed) {
        super(seed);
    }

    /**
     * 가장자리는 벽, 내부는 바닥인 단순 전장을 생성합니다.
     * @override
     */
    _generateMaze() {
        this.width = 50;
        this.height = 40;

        const map = Array.from({ length: this.height }, () =>
            Array(this.width).fill(this.tileTypes.FLOOR)
        );

        for (let x = 0; x < this.width; x++) {
            map[0][x] = this.tileTypes.WALL;
            map[this.height - 1][x] = this.tileTypes.WALL;
        }
        for (let y = 0; y < this.height; y++) {
            map[y][0] = this.tileTypes.WALL;
            map[y][this.width - 1] = this.tileTypes.WALL;
        }
        return map;
    }
}
