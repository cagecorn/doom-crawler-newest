/**
 * 게임의 턴 흐름을 관리합니다.
 * '누구의 차례인가'와 '행동(애니메이션)이 진행 중인가'를 관리하는 핵심 지휘자입니다.
 */
export class WorldTurnManager {
    /**
     * @param {object} config.movementEngine - 현재 진행 중인 움직임이 있는지 확인하기 위함
     * @param {Array<object>} config.entities - 턴에 참여하는 모든 엔티티 (플레이어, 몬스터 등)
     */
    constructor(config) {
        this.movementEngine = config.movementEngine;
        this.entities = config.entities;
        // 턴 상태: 'PLAYER' (플레이어 턴), 'ENEMY' (적 턴)
        this.currentTurn = 'PLAYER';
    }

    /** 현재 플레이어 턴인지 확인합니다. */
    isPlayerTurn() {
        return this.currentTurn === 'PLAYER';
    }

    /** 현재 행동(애니메이션)이 진행 중인지 확인합니다. */
    isActionInProgress() {
        return this.entities.some(e => this.movementEngine.isMoving(e));
    }

    /** 다음 턴으로 전환합니다. */
    nextTurn() {
        this.currentTurn = this.currentTurn === 'PLAYER' ? 'ENEMY' : 'PLAYER';
    }
}
