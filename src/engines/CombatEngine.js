/**
 * \uC804\uD22C \uD30C\uD2B8 \uACFC\uC815.
 * \uC18C\uADFC\uBA74 \uD130\uB110\uC81C \uC804\uD22C\uC758 \uBAA8\uB4E0 \uAC83\uC744 \uAD8C\uD55C\uD569\uB2C8\uB2E4.
 */
export class CombatEngine {
    constructor(game) {
        this.game = game;
        this.movementEngine = game.movementEngine;
        this.inputHandler = game.inputHandler;
        this.mapManager = game.mapManager;
        this.player = game.player;
        this.monster = game.monster;

        // CombatEngine \uC790\uC2E0\uB9CC\uC758 \uAC04\uB2E8\uD55C \uD130\uB110 \uAD00\uB9AC
        this.currentTurn = 'PLAYER';
    }

    update() {
        // \uC6C0\uC9C1\uC774\uB294 \uC560\uB2C8\uBA54\uC774\uC158 \uC911\uC5D0\uB294 \uC544\uBB34\uAC83\uB3C4 \uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.
        if (this.movementEngine.isMoving(this.player) || this.movementEngine.isMoving(this.monster)) {
            return;
        }

        if (this.currentTurn === 'PLAYER') {
            this.handlePlayerInput();
        } else {
            this.handleEnemyAI();
        }
    }

    handlePlayerInput() {
        // TODO: \uD50C\uB808\uC774\uC5B4 \uC785\uB825 \uCD94\uAC00
        // ...
        // this.currentTurn = 'ENEMY';
    }

    handleEnemyAI() {
        // TODO: \uAC04\uB2E8\uD55C AI \uB77C\uC774\uD504
        this.currentTurn = 'PLAYER';
    }

    render() {
        // \uC804\uD22C \uC7A5\uBA74\uC5D0 \uD544\uC694\uD55C \uAC83\uB4E4\uC744 \uADF8\uB9AC\uB294\uB2E4.
        const baseCtx = this.game.layerManager.contexts.mapBase;
        const decorCtx = this.game.layerManager.contexts.mapDecor;
        const entityCtx = this.game.layerManager.contexts.entity;
        const assets = this.game.assets;

        this.mapManager.render(baseCtx, decorCtx, assets);
        this.player.draw?.(entityCtx);
        this.monster.draw?.(entityCtx);
    }
}
