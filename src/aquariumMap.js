// src/aquariumMap.js
// Specialized map where new features can be placed and tested
import { MapManager } from './map.js';

export class AquariumMapManager extends MapManager {
    constructor(seed) {
        super(seed);
        this.name = 'aquarium';
        // wider passages help observe pathfinding for mercenaries and monsters
        this.corridorWidth = 12;
        // regenerate with the new corridor width
        this.map = this._generateMaze();
    }

    _generateMaze() {
        // use the base maze generation but with a larger corridor width
        return super._generateMaze();
    }

    // Aquarium floors focus on wide corridors for pathfinding tests, so skip
    // placing rooms to create a pure maze layout.
    _generateRooms(map) {
        // no-op to keep corridors unobstructed
    }
}
