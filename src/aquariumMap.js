// src/aquariumMap.js
// Specialized map where new features can be placed and tested
import { MapManager } from './map.js';

export class AquariumMapManager extends MapManager {
    constructor(seed) {
        super(seed);
        this.name = 'aquarium';
        // slightly narrower corridors for a tighter maze feel
        this.corridorWidth = 6;
        // regenerate with the new corridor width
        this.map = this._generateMaze();
    }

    _generateMaze() {
        // use the base maze generation with the adjusted corridor width
        return super._generateMaze();
    }

    // Aquarium floors skip room generation to emphasize maze corridors.
    _generateRooms(map) {
        // no-op to keep corridors unobstructed
    }
}
