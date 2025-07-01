export class GroupManager {
    constructor(eventManager = null, getEntityById = null) {
        this.eventManager = eventManager;
        this.getEntityById = getEntityById;
        this.groups = {};
        console.log('[GroupManager] Initialized');
        if (this.eventManager) {
            this.eventManager.subscribe('entity_removed', ({ victimId }) => {
                this.removeMemberFromAll(victimId);
            });
        }
    }

    addMember(entity) {
        if (!entity || !entity.groupId) return;
        const groupId = entity.groupId;
        if (!this.groups[groupId]) this.groups[groupId] = [];
        if (!this.groups[groupId].includes(entity.id)) {
            this.groups[groupId].push(entity.id);
        }
    }

    removeMember(entity) {
        if (!entity || !entity.groupId) return;
        const groupId = entity.groupId;
        if (this.groups[groupId]) {
            this.groups[groupId] = this.groups[groupId].filter(id => id !== entity.id);
        }
    }

    removeMemberFromAll(entityId) {
        for (const groupId of Object.keys(this.groups)) {
            this.groups[groupId] = this.groups[groupId].filter(id => id !== entityId);
        }
    }

    /**
     * Remove a specific member from a specific group.
     * @param {string} groupId
     * @param {string} memberId
     */
    removeMemberFromGroup(groupId, memberId) {
        if (this.groups[groupId]) {
            const idx = this.groups[groupId].indexOf(memberId);
            if (idx !== -1) {
                this.groups[groupId].splice(idx, 1);
                console.log(`[GroupManager] 그룹 ${groupId}에서 멤버 ${memberId} 제거 완료.`);
            }
            if (this.groups[groupId].length === 0) {
                console.log(`[GroupManager] 그룹 ${groupId}에 멤버가 없어 그룹을 해체합니다.`);
                this.removeGroup(groupId);
            }
        }
    }

    /**
     * Remove an entire group.
     * @param {string} groupId
     */
    removeGroup(groupId) {
        if (this.groups[groupId]) {
            delete this.groups[groupId];
            console.log(`[GroupManager] 그룹 ${groupId}가 완전히 제거되었습니다.`);
        }
    }

    getGroupMembers(groupId) {
        const ids = this.groups[groupId] || [];
        if (this.getEntityById) {
            return ids.map(id => this.getEntityById(id)).filter(Boolean);
        }
        return ids;
    }
}
