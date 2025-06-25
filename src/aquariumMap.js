// src/aquariumMap.js
// Fixed three-lane map for testing lane mechanics
import { MapManager } from './map.js';

export class AquariumMapManager extends MapManager {
    constructor(seed) {
        super(seed);
        this.name = 'aquarium';
        this.corridorWidth = 5; // widen lane width
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
                        if (isBaseColumn) {
                            // Bases are fully open vertically
                            map[y][x] = this.tileTypes.FLOOR;
                        } else {
                            map[y][x] = this.tileTypes.FLOOR;
                        }
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

        return map;
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
