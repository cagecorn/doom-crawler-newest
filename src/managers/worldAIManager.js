// src/ai/worldAIManager.js
export class WorldAIManager {
    constructor({ walkManager, movementEngine, combatManager, apManager }) {
        this.walkManager = walkManager;
        this.movementEngine = movementEngine;
        this.combatManager = combatManager;
        this.apManager = apManager;
    }

    /**
     * 몬스터의 턴을 받아 행동을 처리합니다.
     * @param {object} monster - 행동할 몬스터
     * @param {object} player - 목표 대상인 플레이어
     * @param {function} onTurnEnd - 턴 종료 시 호출될 콜백 함수
     */
    handleMonsterTurn(monster, player, onTurnEnd) {
        const performAction = () => {
            // 움직이는 중이거나 AP가 없으면 행동을 멈추고 턴을 종료합니다.
            if (this.movementEngine.isMoving(monster) || !this.apManager.hasEnoughAP(monster, 1)) {
                onTurnEnd();
                return;
            }

            // 1. 플레이어가 사거리 내에 있으면 공격
            if (this.combatManager.isAdjacent(monster, player)) {
                this.combatManager.attemptAttack(monster, player);
                onTurnEnd(); // 공격 후에는 바로 턴 종료
                return;
            }

            // 2. 사거리 밖에 있으면 이동
            const nextStep = this.walkManager.getNextStep(monster, player);
            if (nextStep && this.apManager.spendAP(monster, 1)) {
                this.movementEngine.startMovement(monster, nextStep);
                // 이동 후 다음 행동을 결정하기 위해 잠시 후 다시 이 함수를 호출합니다.
                setTimeout(performAction, 300); // 0.3초 후 다음 행동 결정
            } else {
                onTurnEnd(); // 더 이상 이동할 수 없으면 턴 종료
            }
        };

        performAction();
    }
}
