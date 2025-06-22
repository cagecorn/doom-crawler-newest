import { MapManager } from './map.js';

export class SideScrollerMapManager extends MapManager {
    constructor(seed) {
        super(seed);
        this.name = 'sideScroller';
        this.roomWidth = 8;
        this.roomHeight = 6;
        this.columns = 3;
        this.rows = 2;
        this.corridorWidth = 2;
        this.map = this._generateMaze();
    }

    _generateMaze() {
        const width = this.columns * this.roomWidth + (this.columns + 1) * this.corridorWidth;
        const height = this.rows * this.roomHeight + (this.rows + 1) * this.corridorWidth;
        this.width = width;
        this.height = height;
        const map = Array.from({ length: height }, () => Array(width).fill(this.tileTypes.WALL));
        this.rooms = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                const roomX = this.corridorWidth + c * (this.roomWidth + this.corridorWidth);
                const roomY = this.corridorWidth + r * (this.roomHeight + this.corridorWidth);
                for (let y = roomY; y < roomY + this.roomHeight; y++) {
                    for (let x = roomX; x < roomX + this.roomWidth; x++) {
                        map[y][x] = this.tileTypes.FLOOR;
                    }
                }
                this.rooms.push({ x: roomX, y: roomY, width: this.roomWidth, height: this.roomHeight });

                if (c > 0) {
                    const corridorY = roomY + Math.floor(this.roomHeight / 2);
                    const startX = roomX - this.corridorWidth;
                    for (let y = corridorY; y < corridorY + this.corridorWidth; y++) {
                        for (let x = startX; x < roomX; x++) {
                            map[y][x] = this.tileTypes.FLOOR;
                        }
                    }
                }
                if (r > 0) {
                    const corridorX = roomX + Math.floor(this.roomWidth / 2);
                    const startY = roomY - this.corridorWidth;
                    for (let x = corridorX; x < corridorX + this.corridorWidth; x++) {
                        for (let y = startY; y < roomY; y++) {
                            map[y][x] = this.tileTypes.FLOOR;
                        }
                    }
                }
            }
        }
        return map;
    }
}
