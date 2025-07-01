/**
 * 그리드 및 타일 관련 시각화를 전담하는 렌더러입니다.
 * WebGPU를 최종 목표로 하지만, 초기에는 Canvas 2D API를 사용해 구현합니다.
 */
import { TileRenderEngine } from './tileRenderEngine.js';
import { EffectRenderEngine } from './effectRenderEngine.js';
import { DebugOverlayEngine } from './debugOverlayEngine.js';

/**
 * 시각화 전문가. 그리드와 관련된 모든 렌더링을 지시합니다.
 */
export class GridRenderer {
    constructor(config) {
        this.mapWidth = config.mapWidth;
        this.mapHeight = config.mapHeight;
        this.tileSize = config.tileSize;
        this.lineColor = config.lineColor || '#000';
        this.lineWidth = config.lineWidth || 6;

        // 렌더링 전문 엔진들을 고용합니다.
        this.tileRenderEngine = new TileRenderEngine(config);
        this.effectRenderEngine = new EffectRenderEngine(config);
        this.debugOverlayEngine = new DebugOverlayEngine(config);

        this.showDebug = true; // 디버그 모드 on/off
    }

    /**
     * 지정된 캔버스 컨텍스트에 그리드를 그립니다.
     * @param {CanvasRenderingContext2D} ctx - 그리기 작업을 수행할 2D 컨텍스트
     */
    render(ctx, gridData = null, effectData = null, debugData = null) {
        // 각 엔진에게 자신의 전문 분야를 그리라고 지시합니다.
        this.tileRenderEngine.drawGridLines(
            ctx,
            this.mapWidth,
            this.mapHeight,
            this.tileSize,
            this.lineColor,
            this.lineWidth
        );
        this.effectRenderEngine.render(ctx, effectData);
        if (this.showDebug) {
            this.debugOverlayEngine.render(ctx, debugData);
        }
    }
}

