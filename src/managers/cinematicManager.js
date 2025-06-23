export class CinematicManager {
    constructor(game) {
        this.game = game;
        this.eventManager = game.eventManager;
        this.isPlaying = false;
        this.targetEntity = null;
        this.targetZoom = 1;
        this.originalZoom = 1;
        this.originalTimeScale = 1;

        this.init();
    }

    init() {
        this.eventManager.subscribe('weapon_disarmed', (data) => {
            if (data.weapon) {
                this.playItemCloseup(data.weapon);
            } else {
                this.triggerMicroWorldJudgement(data.defender);
            }
        });
        this.eventManager.subscribe('armor_broken', (data) => {
            if (data.armor) {
                this.playItemCloseup(data.armor);
            } else {
                this.triggerMicroWorldJudgement(data.defender);
            }
        });
    }

    triggerMicroWorldJudgement(target) {
        this.triggerCinematic(target, 'MICROWORLD JUDGEMENT!', 2000);
    }

    triggerCinematic(target, text, duration) {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.targetEntity = target;

        // Save the game's current zoom and time scale so we can restore them
        // precisely once the cinematic ends.
        this.originalZoom = this.game.gameState.zoomLevel;
        this.originalTimeScale = this.game.gameLoop.timeScale;

        this.targetZoom = this.originalZoom * 1.8;
        console.log('계산된 카메라 줌 레벨:', this.targetZoom);
        this.targetZoom = Math.min(this.targetZoom, 10);
        this.game.gameLoop.timeScale = 0.2;

        this.game.vfxManager.addCinematicText(text, duration);

        setTimeout(() => {
            this.reset();
        }, duration);
    }

    playItemCloseup(item) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.targetEntity = item;

        this.originalZoom = this.game.gameState.zoomLevel;
        this.originalTimeScale = this.game.gameLoop.timeScale;
        this.targetZoom = this.originalZoom * 2.2;
        console.log('계산된 카메라 줌 레벨:', this.targetZoom);
        this.targetZoom = Math.min(this.targetZoom, 10);
        this.game.gameLoop.timeScale = 0.1;

        // simple WebGL highlight
        const canvas = this.game.layerManager.layers.vfx;
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl && item.image) {
            gl.clearColor(0, 0, 0, 0.5);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // WebGL implementation placeholder - textured quad
        }

        setTimeout(() => {
            this.reset();
            this.eventManager.publish('cinematic_complete', { id: item.id });
        }, 1500);
    }

    reset() {
        this.targetZoom = this.originalZoom;
        this.game.gameLoop.timeScale = this.originalTimeScale;
        this.targetEntity = null;
        setTimeout(() => {
            this.isPlaying = false;
            this.eventManager.publish('cinematic_complete');
        }, 500);
    }
}
