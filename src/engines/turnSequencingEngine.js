/**
 * \u2699\uFE0F \uD130\uB110 \uC21C\uC11C \uACB0\uC815 \uC5D4\uC9C4
 * \uD130\uB110\uC758 \uC21C\uC11C\uB97C \uACB0\uC815\uD569\uB2C8\uB2E4. (\uB2E8\uC21C \uC21C\uC11C, \uBBFC\uCDE8\uC131 \uAE30\uBC18 \uB4F1)
 */
export class TurnSequencingEngine {
    constructor(entities = []) {
        // 엔티티 목록이 주어지지 않으면 빈 배열로 초기화하여
        // 호출 부주의로 인한 오류를 방지합니다.
        this.entities = entities;
        this.currentIndex = 0;
    }

    // \uC608\uC2DC: getNextEntity()
    getCurrentEntity() {
        // 엔티티가 없으면 null을 반환하여 상위 로직이 적절히 처리하도록 합니다.
        if (!this.entities.length) return null;
        this.currentIndex %= this.entities.length;
        return this.entities[this.currentIndex];
    }
}
