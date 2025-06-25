// src/aquariumMap.js
// Fixed three-lane map for testing lane mechanics
import { MapManager } from './map.js';

export class AquariumMapManager extends MapManager {
    constructor(seed) {
        super(seed);
        this.name = 'aquarium';
        this.corridorWidth = 5; // widen lane width
        this.jungleWidth = 3;   // slightly thinner jungle corridors
        this.openArea = 6;
        this.map = this._generateMaze();
    }

    // Generate a simple three-lane layout separated by walls. Left and right edges
    // are open so all lanes converge at the bases.
    _generateMaze() {
        const map = Array.from({ length: this.height }, () =>
            Array(this.width).fill(this.tileTypes.WALL)
        );

        const openArea = this.openArea; // width of the bases at left and right
        const half = Math.floor(this.corridorWidth / 2);
        const lanes = [
            Math.floor(this.height * 0.2),
            Math.floor(this.height * 0.5),
            Math.floor(this.height * 0.8)
        ];
        this.lanes = lanes;
        this.laneCenters = lanes.map(l => l * this.tileSize + this.tileSize / 2);

        for (let x = 0; x < this.width; x++) {
            const isBaseColumn = x < openArea || x >= this.width - openArea;
            for (const laneY of lanes) {
                for (let y = laneY - half; y <= laneY + half; y++) {
                    if (y >= 0 && y < this.height) {
                        // lanes themselves are wide open
                        map[y][x] = this.tileTypes.FLOOR;
                    }
                }
            }

            if (isBaseColumn) {
                // also open the rest of the base columns
                for (let y = 0; y < this.height; y++) {
                    map[y][x] = this.tileTypes.FLOOR;
                }
            }
        }

        // carve jungle-style maze between lanes
        for (let i = 0; i < lanes.length - 1; i++) {
            const top = lanes[i] + half + 1;
            const bottom = lanes[i + 1] - half - 1;
            if (bottom > top) {
                this._generateJungleZone(map, top, bottom);
            }
        }

        return map;
    }

    _generateJungleZone(map, startY, endY) {
        const width = this.jungleWidth;
        const step = width + 1;

        // small rooms for neutral monsters
        this._generateJungleRooms(map, startY, endY, width);

        const margin = Math.ceil(width / 2);
        for (let y = startY + step; y < endY - step; y += step) {
            for (let x = this.openArea + step; x < this.width - this.openArea - step; x += step) {
                if (this._isAreaWallCustom(map, x, y, width)) {
                    this._carveMazeFromCustom(map, x, y, width, startY + margin, endY - margin);
                }
            }
        }
    }

    _generateJungleRooms(map, startY, endY, width) {
        const roomCount = 3;
        const minSize = 3;
        const maxSize = 5;
        for (let i = 0; i < roomCount; i++) {
            const w = Math.floor(this._random() * (maxSize - minSize + 1)) + minSize;
            const h = Math.floor(this._random() * (maxSize - minSize + 1)) + minSize;
            const x = Math.floor(this._random() * (this.width - this.openArea * 2 - w)) + this.openArea;
            const y = Math.floor(this._random() * (endY - startY - h)) + startY;

            if (this._isAreaWallCustom(map, x + Math.floor(w/2), y + Math.floor(h/2), Math.max(w,h))) {
                for (let yy = y; yy < y + h; yy++) {
                    for (let xx = x; xx < x + w; xx++) {
                        if (yy >= startY && yy < endY && xx >= this.openArea && xx < this.width - this.openArea) {
                            map[yy][xx] = this.tileTypes.FLOOR;
                        }
                    }
                }
                this.rooms.push({ x, y, width: w, height: h });
            }
        }
    }

    _carveMazeFromCustom(map, startX, startY, width, minY, maxY) {
        const stack = [{ x: startX, y: startY }];
        const step = width + 1;
        this._carveAreaCustom(map, startX, startY, width);

        while (stack.length) {
            const cur = stack[stack.length - 1];
            const dirs = [
                { x: 0, y: -step },
                { x: 0, y: step },
                { x: -step, y: 0 },
                { x: step, y: 0 }
            ];
            dirs.sort(() => this._random() - 0.5);

            let moved = false;
            for (const dir of dirs) {
                const nx = cur.x + dir.x;
                const ny = cur.y + dir.y;
                if (this._isValidMazePositionCustom(nx, ny, width, minY, maxY) && this._isAreaWallCustom(map, nx, ny, width)) {
                    this._carveCorridorCustom(map, cur.x, cur.y, nx, ny, width);
                    this._carveAreaCustom(map, nx, ny, width);
                    stack.push({ x: nx, y: ny });
                    moved = true;
                    break;
                }
            }
            if (!moved) stack.pop();
        }
    }

    _carveAreaCustom(map, centerX, centerY, width) {
        const half = Math.floor(width / 2);
        for (let y = centerY - half; y <= centerY + half; y++) {
            for (let x = centerX - half; x <= centerX + half; x++) {
                if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                    map[y][x] = this.tileTypes.FLOOR;
                }
            }
        }
    }

    _carveCorridorCustom(map, x1, y1, x2, y2, width) {
        const half = Math.floor(width / 2);
        if (x1 === x2) {
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            for (let y = minY; y <= maxY; y++) {
                for (let x = x1 - half; x <= x1 + half; x++) {
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        map[y][x] = this.tileTypes.FLOOR;
                    }
                }
            }
        } else if (y1 === y2) {
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            for (let x = minX; x <= maxX; x++) {
                for (let y = y1 - half; y <= y1 + half; y++) {
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        map[y][x] = this.tileTypes.FLOOR;
                    }
                }
            }
        }
    }

    _isAreaWallCustom(map, centerX, centerY, size) {
        const half = Math.floor(size / 2);
        for (let y = centerY - half; y <= centerY + half; y++) {
            for (let x = centerX - half; x <= centerX + half; x++) {
                if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                    if (map[y][x] === this.tileTypes.FLOOR) return false;
                }
            }
        }
        return true;
    }

    _isValidMazePositionCustom(x, y, width, minY, maxY) {
        const margin = Math.ceil(width / 2);
        return x >= margin && x < this.width - margin && y >= minY && y < maxY;
    }

    // disable room generation entirely
    _generateRooms(map) {}

    getLaneCenters() {
        return this.laneCenters;
    }

    getPlayerStartingPosition() {
        const x = (this.openArea / 2) * this.tileSize - this.tileSize / 2;
        const y = this.laneCenters[1]; // middle lane
        return { x, y };
    }
}
