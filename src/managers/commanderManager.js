export class CommanderManager {
    /**
     * @param {GroupManager} groupManager - 그룹 정보를 관리하는 매니저
     */
    constructor(groupManager) {
        this.groupManager = groupManager;
        console.log("[CommanderManager] Initialized");
    }

    /**
     * 지휘관 엔티티를 기반으로 부대 정보를 계산하여 반환합니다.
     * @param {Entity} commanderEntity - 정보를 조회할 지휘관 엔티티
     * @returns {object|null} 부대 정보 객체 또는 null
     */
    getUnitInfo(commanderEntity) {
        if (!this.groupManager || !commanderEntity.groupId) {
            console.error("[CommanderManager] GroupManager가 없거나 엔티티가 지휘관이 아닙니다.");
            return null;
        }

        const members = this.groupManager.getGroupMembers(commanderEntity.groupId);

        if (!members || members.length === 0) {
            // 부대원이 없는 경우에도 기본 정보 반환
            return {
                commanderName: commanderEntity.name || commanderEntity.id,
                troopTypes: 0,
                totalHp: 0,
                currentHp: 0,
                troopDetails: [],
                totalMembers: 0
            };
        }

        let totalHp = 0;
        let currentHp = 0;
        const troopTypeCounts = new Map();

        for (const member of members) {
            // 모든 유닛은 hp와 maxHp 속성을 가집니다.
            totalHp += member.maxHp || 0;
            currentHp += member.hp || 0;

            const job = member.jobId || 'Unknown';
            troopTypeCounts.set(job, (troopTypeCounts.get(job) || 0) + 1);
        }

        // Map을 배열로 변환하여 UI에서 쉽게 사용할 수 있도록 합니다.
        const troopDetails = Array.from(troopTypeCounts.entries()).map(([jobId, count]) => ({ jobId, count }));

        return {
            commanderName: commanderEntity.name || commanderEntity.jobId,
            troopTypes: troopTypeCounts.size,
            totalHp: Math.round(totalHp),
            currentHp: Math.round(currentHp),
            troopDetails: troopDetails,
            totalMembers: members.length
        };
    }
}
