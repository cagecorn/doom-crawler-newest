// src/managers/worldCombatManager.js
export class WorldCombatManager {
    constructor(game, apManager) {
        this.game = game;
        this.apManager = apManager;
    }

    /**
     * 두 유닛이 인접하여 공격 가능한지 확인합니다.
     * @param {object} unitA 
     * @param {object} unitB 
     * @returns {boolean}
     */
    isAdjacent(unitA, unitB) {
        const dx = Math.abs(unitA.tileX - unitB.tileX);
        const dy = Math.abs(unitA.tileY - unitB.tileY);
        return (dx <= 1 && dy <= 1) && (dx + dy > 0);
    }

    /**
     * 공격을 시도하고, 성공 시 관련 로직을 처리합니다.
     * @param {object} attacker - 공격하는 유닛
     * @param {object} target - 공격받는 유닛
     * @returns {boolean} - 공격 성공 여부
     */
    attemptAttack(attacker, target) {
        if (!this.isAdjacent(attacker, target)) {
            console.log("공격 실패: 대상이 사거리에 없습니다.");
            return false;
        }

        // 공격에는 최소 1의 AP가 필요하다고 가정합니다.
        if (!this.apManager.hasEnoughAP(attacker, 1)) {
            console.log("공격 실패: 행동 포인트가 부족합니다.");
            return false;
        }

        console.log(`${attacker.entity ? '플레이어' : '몬스터'}가 ${target.entity ? '플레이어' : '몬스터'}를 공격합니다!`);
        
        // 공격에 남은 AP를 모두 소모합니다.
        this.apManager.expendAllAP(attacker);

        // 'entity_attack' 이벤트를 발생시켜 타격 애니메이션을 재생합니다.
        this.game.eventManager.publish('entity_attack', { 
            attacker: attacker.entity || attacker, 
            defender: target.entity || target 
        });

        // 데미지 계산 및 적용 (이 부분은 실제 게임의 combatCalculator를 사용하도록 확장할 수 있습니다)
        const damage = (attacker.entity?.attackPower || 10) - (target.entity?.stats.get('defense') || 5);
        if (target.entity) {
            target.entity.takeDamage(Math.max(1, damage));
        } else { 
            target.hp = (target.hp || 100) - Math.max(1, damage);
        }
        
        console.log(`[${target.entity ? 'Player' : 'Monster'}] 남은 HP:`, target.entity ? target.entity.hp : target.hp);

        return true;
    }
}
