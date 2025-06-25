// src/managers/laneRenderManager.js
// 단순한 라인 오버레이를 그려 3-Lane 구조를 시각화합니다.
export class LaneRenderManager {
    constructor(laneManager) {
        this.laneManager = laneManager;
    }

    render(ctx) {
        const { laneY, mapWidth } = this.laneManager;
        if (!laneY) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 4;
        const lines = [laneY.TOP, laneY.MID, laneY.BOTTOM];
        for (const y of lines) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
            ctx.stroke();
        }
        ctx.restore();
    }
}
