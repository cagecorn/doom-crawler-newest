class FormationManager {
    constructor(cols, rows, tileSize, eventManager = null) {
        this.cols = cols;
        this.rows = rows;
        this.tileSize = tileSize; // 타일 크기 (예: 64)
        this.slots = new Array(cols * rows).fill(null); // 각 슬롯에는 분대(squad) 객체가 저장됨
        this.eventManager = eventManager;
        this.eventManager?.subscribe('formation_assign_request', this.handleAssignSquad.bind(this));
    }
    
    handleAssignSquad({ squadId, slotIndex }) {
        // 기존에 이 분대가 다른 슬롯에 있었다면 제거
        const existingIndex = this.slots.findIndex(s => s && s.id === squadId);
        if (existingIndex > -1) {
            this.slots[existingIndex] = null;
        }

        // 새 슬롯에 분대 할당
        // 참고: squadManager에서 실제 squad 객체를 가져와야 합니다. 여기서는 임시로 ID만 저장합니다.
        // 실제 구현에서는 game.js 등에서 squadManager.getSquad(squadId)를 통해 객체를 전달받아야 합니다.
        this.slots[slotIndex] = { id: squadId }; // 임시 객체, 실제로는 squad 객체여야 함

        console.log(`${squadId} 분대를 슬롯 ${slotIndex}에 배치 요청`);
        this.eventManager?.publish('formation_data_changed', { slots: this.slots });
    }

    getSlotPosition(index) {
        const x = (index % this.cols) * this.tileSize;
        const y = Math.floor(index / this.cols) * this.tileSize;
        return { x, y };
    }

    // 분대를 진형에 배치하고, 멤버들의 위치를 설정
    apply(origin, entityMap, squadManager) {
        this.slots.forEach((squadData, idx) => {
            if (!squadData) return;

            const squad = squadManager.getSquad(squadData.id);
            if (!squad || !squad.members) return;

            const basePos = this.getSlotPosition(idx);

            squad.members.forEach(entityId => {
                const ent = entityMap[entityId];
                if (ent) {
                    // 타일 크기 내에서 무작위 오프셋 추가하여 뭉쳐있는 효과
                    const randomOffsetX = (Math.random() - 0.5) * this.tileSize * 0.8;
                    const randomOffsetY = (Math.random() - 0.5) * this.tileSize * 0.8;
                    
                    ent.x = origin.x + basePos.x + randomOffsetX;
                    ent.y = origin.y + basePos.y + randomOffsetY;
                }
            });
        });
    }
}

export { FormationManager };
