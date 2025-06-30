// src/ai/worldAIManager.js
export class WorldAIManager {
    constructor({ walkManager, movementEngine, combatManager, apManager }) {
        this.walkManager = walkManager;
        this.movementEngine = movementEngine;
        this.combatManager = combatManager;
        this.apManager = apManager;
        this.isProcessing = false; // 현재 AI가 행동 중인지 여부를 나타내는 플래그
    }

    /**
     * 몬스터의 턴을 받아 행동을 처리합니다.
     * @param {object} monster - 행동할 몬스터
     * @param {object} player - 목표 대상인 플레이어
     * @param {function} onTurnEnd - 턴 종료 시 호출될 콜백 함수
     */
    handleMonsterTurn(monster, player, onTurnEnd) {
        // 이미 다른 AI 루틴이 실행 중이라면 중복 실행을 방지합니다.
        if (this.isProcessing) return;

        this.isProcessing = true;

        const performAction = () => {
            // 1. 공격이 가능하면 즉시 공격하고 턴을 종료합니다.
            if (this.combatManager.isAdjacent(monster, player)) {
                this.combatManager.attemptAttack(monster, player);
                this.isProcessing = false;
                onTurnEnd(); // 턴 종료 콜백 호출
                return;
            }

            // 2. 이동할 AP가 남아있으면 플레이어를 향해 이동합니다.
            if (this.apManager.hasEnoughAP(monster, 1)) {
                const nextStep = this.walkManager.getNextStep(monster, player);
                if (nextStep) {
                    this.apManager.spendAP(monster, 1);
                    this.movementEngine.startMovement(monster, nextStep);
                    // 이동이 끝난 후 다시 행동을 결정해야 하므로, 여기서는 턴을 종료하지 않습니다.
                    // worldEngine의 update 루프가 이동이 끝난 것을 감지하고 다시 AI를 깨울 것입니다.
                    this.isProcessing = false;
                    return;
                }
            }

            // 3. 더 이상 할 수 있는 행동이 없으면 턴을 종료합니다.
            // (AP가 없거나, 이동할 경로가 없는 경우)
            this.isProcessing = false;
            onTurnEnd();
        };

        // 몬스터의 행동을 시작합니다.
        performAction();
    }
}
