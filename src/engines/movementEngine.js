/**
 * 엔티티의 타일 기반 이동과 부드러운 애니메이션을 담당하는 엔진입니다.
 * '어떻게' 움직일지를 계산합니다.
 */
export class MovementEngine {
    constructor(config) {
        this.tileSize = config.tileSize;
        // 현재 진행 중인 모든 움직임을 관리합니다. (나중에 여러 유닛이 동시에 움직일 때를 위함)
        this.activeMovements = [];
    }

    /**
     * 특정 엔티티의 이동을 시작합니다.
     * @param {object} entity - 이동할 대상 (예: player)
     * @param {{x: number, y: number}} targetTile - 목표 타일 좌표 (예: {x: 5, y: 3})
     * @param {number} duration - 이동에 걸리는 시간 (밀리초 단위)
     */
    startMovement(entity, targetTile, duration = 200) {
        // 이미 움직이는 중이면 새로운 이동을 시작하지 않습니다.
        if (this.isMoving(entity)) {
            return;
        }

        const movement = {
            entity: entity,
            // 시작 화면 좌표
            startX: entity.x,
            startY: entity.y,
            // 목표 화면 좌표
            targetX: targetTile.x * this.tileSize,
            targetY: targetTile.y * this.tileSize,
            // 목표 타일 좌표 (이동 완료 후 업데이트용)
            targetTileX: targetTile.x,
            targetTileY: targetTile.y,
            duration: duration,
            elapsedTime: 0,
        };

        this.activeMovements.push(movement);
    }

    /**
     * 특정 엔티티가 현재 움직이는 중인지 확인합니다.
     * @param {object} entity
     * @returns {boolean}
     */
    isMoving(entity) {
        return this.activeMovements.some(m => m.entity === entity);
    }

    /**
     * 매 프레임마다 호출되어 모든 활성 움직임을 업데이트합니다.
     * @param {number} deltaTime - 프레임 간 시간 간격
     */
    update(deltaTime) {
        // 배열을 역순으로 순회해야 안전하게 요소를 제거할 수 있습니다.
        for (let i = this.activeMovements.length - 1; i >= 0; i--) {
            const move = this.activeMovements[i];
            move.elapsedTime += deltaTime * 1000; // deltaTime은 초 단위이므로 ms로 변환

            if (move.elapsedTime >= move.duration) {
                // --- 이동 완료 ---
                // 정확한 목표 위치로 엔티티 좌표를 설정합니다.
                move.entity.x = move.targetX;
                move.entity.y = move.targetY;
                // 타일 좌표도 업데이트합니다.
                move.entity.tileX = move.targetTileX;
                move.entity.tileY = move.targetTileY;

                // 완료된 움직임을 목록에서 제거합니다.
                this.activeMovements.splice(i, 1);
            } else {
                // --- 이동 진행 중 ---
                // 이동 진행률(0.0 ~ 1.0)을 계산합니다.
                const progress = move.elapsedTime / move.duration;
                // 시작점과 끝점 사이의 현재 위치를 계산(선형 보간)하여 엔티티의 화면 좌표를 업데이트합니다.
                move.entity.x = move.startX + (move.targetX - move.startX) * progress;
                move.entity.y = move.startY + (move.targetY - move.startY) * progress;
            }
        }
    }
}
