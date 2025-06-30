// src/managers/apManager.js
export class APManager {
    /**
     * 유닛의 AP 속성을 초기화합니다.
     * @param {object} unit - AP를 추가할 유닛 (플레이어 또는 몬스터)
     * @param {number} maxAp - 최대 행동 포인트
     */
    initializeUnit(unit, maxAp = 4) {
        unit.ap = maxAp;
        unit.maxAp = maxAp;
    }

    /**
     * 모든 유닛의 AP를 최대치로 초기화합니다.
     * @param {Array<object>} units - 모든 유닛의 배열
     */
    resetActionPoints(units) {
        units.forEach(unit => {
            if (unit) {
                unit.ap = unit.maxAp;
            }
        });
        console.log("모든 유닛의 행동 포인트가 초기화되었습니다.");
    }

    /**
     * 유닛의 AP를 소모합니다.
     * @param {object} unit - AP를 소모할 유닛
     * @param {number} cost - 소모할 AP 양
     * @returns {boolean} - AP 소모 성공 여부
     */
    spendAP(unit, cost) {
        if (this.hasEnoughAP(unit, cost)) {
            unit.ap -= cost;
            return true;
        }
        return false;
    }

    /**
     * 행동에 필요한 AP가 충분한지 확인합니다.
     * @param {object} unit - 확인할 유닛
     * @param {number} cost - 필요한 AP 양
     * @returns {boolean} - AP 충분 여부
     */
    hasEnoughAP(unit, cost) {
        return unit.ap >= cost;
    }

    /**
     * 유닛의 남은 AP를 모두 소진시킵니다 (주로 공격 후 사용).
     * @param {object} unit - AP를 소진할 유닛
     */
    expendAllAP(unit) {
        unit.ap = 0;
    }
}
