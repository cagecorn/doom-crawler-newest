// src/utils/entityUtils.js

/**
 * 지정된 좌표와 반경 내에 있는 모든 유닛을 찾습니다.
 * @param {number} centerX - 중심 x 좌표
 * @param {number} centerY - 중심 y 좌표
 * @param {number} radius - 반경
 * @param {Entity[]} entities - 검색 대상 유닛 배열
 * @param {Entity} [exclude=null] - 검색에서 제외할 유닛
 * @returns {Entity[]} - 범위 내 유닛 배열
 */
export function findEntitiesInRadius(centerX, centerY, radius, entities, exclude = null) {
    const found = [];
    for (const entity of entities) {
        if (entity === exclude) continue;

        const entityCenterX = entity.x + entity.width / 2;
        const entityCenterY = entity.y + entity.height / 2;
        const distance = Math.hypot(centerX - entityCenterX, centerY - entityCenterY);
        if (distance <= radius) {
            found.push(entity);
        }
    }
    return found;
}

/**
 * 주어진 위치에서 가장 가까운 엔티티를 찾습니다.
 * @param {{x:number,y:number}} pos - 기준 위치
 * @param {Entity[]} entities - 검색 대상 엔티티 배열
 * @returns {Entity|null}
 */
export function findNearestEntity(pos, entities) {
    if (!entities || entities.length === 0) return null;
    let nearest = null;
    let minDist = Infinity;
    for (const entity of entities) {
        const d = Math.hypot(pos.x - entity.x, pos.y - entity.y);
        if (d < minDist) {
            minDist = d;
            nearest = entity;
        }
    }
    return nearest;
}
