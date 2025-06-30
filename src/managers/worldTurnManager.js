// src/managers/worldTurnManager.js
export class WorldTurnManager {
    constructor() {
        this.entities = [];
        this.turnIndex = -1;
        this.turnProcessed = false; // 현재 턴의 로직이 처리되었는지 여부
    }
    
    setEntities(entities) {
        this.entities = entities.filter(e => e);
        this.turnIndex = -1;
    }
    
    getEntities() {
        return this.entities;
    }

    nextTurn() {
        if (this.entities.length === 0) return;
        this.turnIndex = (this.turnIndex + 1) % this.entities.length;
        this.turnProcessed = false; // 새 턴이 시작되면 플래그 초기화
    }

    getCurrentTurnEntity() {
        return this.entities[this.turnIndex];
    }
    
    getCurrentTurnOwner() {
        const entity = this.getCurrentTurnEntity();
        if (!entity) return 'NONE';
        // 플레이어 객체는 'entity' 속성을 통해 구분합니다.
        return entity.entity ? 'PLAYER' : 'ENEMY';
    }

    isPlayerTurn() {
        return this.getCurrentTurnOwner() === 'PLAYER';
    }

    isTurnProcessed() {
        return this.turnProcessed;
    }

    markTurnAsProcessed() {
        this.turnProcessed = true;
    }
}
