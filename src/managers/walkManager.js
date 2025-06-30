/**
 * 엔티티의 이동 경로를 계산하는 간단한 AI입니다.
 */
export class WalkManager {
    /**
     * 목표를 향한 다음 타일 좌표를 계산합니다. (장애물 고려 X)
     * @param {object} startEntity - 출발 엔티티 (예: monster)
     * @param {object} targetEntity - 목표 엔티티 (예: player)
     * @returns {{x: number, y: number}} 다음 타일 좌표
     */
    getNextStep(startEntity, targetEntity) {
        const nextTile = { x: startEntity.tileX, y: startEntity.tileY };
        const dx = targetEntity.tileX - startEntity.tileX;
        const dy = targetEntity.tileY - startEntity.tileY;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) nextTile.x++;
            else if (dx < 0) nextTile.x--;
        } else {
            if (dy > 0) nextTile.y++;
            else if (dy < 0) nextTile.y--;
        }

        return nextTile;
    }
}
