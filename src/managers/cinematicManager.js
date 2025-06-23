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
            this.triggerMicroWorldJudgement(data.defender);
        });
        this.eventManager.subscribe('armor_broken', (data) => {
            this.triggerMicroWorldJudgement(data.defender);
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
        this.game.gameLoop.timeScale = 0.2;

        this.game.vfxManager.addCinematicText(text, duration);

        setTimeout(() => {
            this.reset();
        }, duration);
    }

    reset() {
        this.targetZoom = this.originalZoom;
        this.game.gameLoop.timeScale = this.originalTimeScale;
        this.targetEntity = null;
        setTimeout(() => {
            this.isPlaying = false;
        }, 500);
    }
}
