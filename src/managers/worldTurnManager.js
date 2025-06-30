// src/managers/worldTurnManager.js
export class WorldTurnManager {
    constructor() {
        this.entities = [];
        this.turnIndex = -1;
    }
    
    setEntities(entities) {
        // null이나 undefined 같은 비정상적인 값이 배열에 포함되지 않도록 필터링합니다.
        this.entities = entities.filter(e => e);
        this.turnIndex = -1;
    }
    
    getEntities() {
        return this.entities;
    }

    nextTurn() {
        if (this.entities.length === 0) {
            this.turnIndex = -1;
            return;
        }
        this.turnIndex = (this.turnIndex + 1) % this.entities.length;
    }

    getCurrentTurnEntity() {
        if (this.turnIndex === -1 || this.entities.length === 0) {
            return null;
        }
        return this.entities[this.turnIndex];
    }
    
    isPlayerTurn() {
        const entity = this.getCurrentTurnEntity();
        if (!entity) return false;
        // 플레이어 객체는 'entity'라는 고유 속성을 가지고 있다는 점을 이용합니다.
        return !!entity.entity;
    }
}
