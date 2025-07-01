export class WorldMapAIManager {
    constructor(entityManager, movementManager, eventManager) {
        this.entityManager = entityManager;
        this.movementManager = movementManager;
        this.eventManager = eventManager;
        console.log('[WorldMapAIManager] Initialized');
    }

    /**
     * 매 프레임 호출되어 모든 지휘관의 행동을 결정합니다.
     * @param {number} deltaTime - 프레임 간 시간
     */
    update(deltaTime) {
        const commanders = this.entityManager.getAllEntities().filter(e => e.isCommander);
        for (const commander of commanders) {
            this._decideAction(commander, commanders);
        }
    }

    /**
     * 지휘관의 다음 행동을 결정하고 실행합니다.
     * @param {object} commander - 행동을 결정할 지휘관
     * @param {Array<object>} allCommanders - 맵 상의 모든 지휘관 리스트
     */
    _decideAction(commander, allCommanders) {
        const nearestEnemy = this._findNearestEnemy(commander, allCommanders);
        if (!nearestEnemy) return;

        const distance = this._calculateDistance(commander, nearestEnemy);
        if (distance <= (commander.attackRange || commander.tileSize)) {
            console.log(`[AI] ${commander.id}가 ${nearestEnemy.id}를 공격합니다!`);
            if (this.movementManager.handleCollision) {
                this.movementManager.handleCollision(commander, nearestEnemy);
            }
        } else {
            if (this.movementManager.moveTowards) {
                this.movementManager.moveTowards(commander, nearestEnemy.x, nearestEnemy.y);
            }
        }
    }

    _findNearestEnemy(commander, allCommanders) {
        let nearestEnemy = null;
        let minDistance = Infinity;
        for (const other of allCommanders) {
            if (other.id === commander.id || other.faction === commander.faction) continue;
            const distance = this._calculateDistance(commander, other);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = other;
            }
        }
        return nearestEnemy;
    }

    _calculateDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
