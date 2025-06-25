import { eventManager } from './eventManager.js';

class SquadManager {
    constructor(maxSquads = 10) {
        this.squads = new Map();
        this.maxSquads = maxSquads;
        this.nextSquadId = 0;

        // 이벤트 리스너 등록
        eventManager.subscribe('squad_assign_request', this.handleAssignMember.bind(this));
    }

    // 새 분대 생성
    createSquad(squadName) {
        if (this.squads.size >= this.maxSquads) {
            console.warn("최대 분대 수를 초과했습니다.");
            return null;
        }
        const squadId = `squad_${this.nextSquadId++}`;
        const newSquad = {
            id: squadId,
            name: squadName || `분대 ${this.nextSquadId}`,
            members: new Set()
        };
        this.squads.set(squadId, newSquad);
        console.log(`${squadId} (${newSquad.name}) 분대가 생성되었습니다.`);
        eventManager.publish('squad_data_changed', { squads: this.getSquads() });
        return newSquad;
    }

    // 분대 해체
    disbandSquad(squadId) {
        if (this.squads.has(squadId)) {
            this.squads.delete(squadId);
            console.log(`${squadId} 분대가 해체되었습니다.`);
            eventManager.publish('squad_data_changed', { squads: this.getSquads() });
            return true;
        }
        return false;
    }
    
    // 이벤트 핸들러: 분대원 할당 요청 처리
    handleAssignMember({ entityId, squadId }) {
        // 먼저 모든 분대에서 해당 용병을 제거
        this.squads.forEach(squad => {
            if (squad.members.has(entityId)) {
                squad.members.delete(entityId);
            }
        });

        // 새로운 분대에 할당 (squadId가 null이 아닐 경우)
        if (squadId && this.squads.has(squadId)) {
            const squad = this.squads.get(squadId);
            squad.members.add(entityId);
            console.log(`${entityId}을(를) ${squadId}에 할당했습니다.`);
        } else {
            console.log(`${entityId}을(를) 모든 분대에서 제외했습니다.`);
        }

        // 데이터 변경 이벤트 발행
        eventManager.publish('squad_data_changed', { squads: this.getSquads() });
    }

    // 특정 분대 정보 가져오기
    getSquad(squadId) {
        return this.squads.get(squadId);
    }

    // 모든 분대 정보 가져오기
    getSquads() {
        return Array.from(this.squads.values());
    }
}

export const squadManager = new SquadManager();
