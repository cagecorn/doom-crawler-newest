import { GameLoop } from './gameLoop.js';

export class GameController {
    constructor(game) {
        this.game = game;
        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this));
    }

    start() {
        this.gameLoop.start();
    }

    update(deltaTime) {
        const g = this.game;
        if (g.gameState.currentState === 'WORLD') {
            g.worldEngine.update(deltaTime);
            if (g.worldMapAIManager) {
                g.worldMapAIManager.update(deltaTime);
            }
            return;
        } else if (g.gameState.currentState === 'FORMATION_SETUP') {
            return;
        } else if (g.gameState.currentState !== 'COMBAT') {
            return;
        }
        g.combatEngine.update(deltaTime);
    }

    render() {
        const g = this.game;
        g.layerManager.clear();
        if (g.gameState.currentState === 'WORLD') {
            g.worldEngine.render(
                g.layerManager.contexts.mapBase,
                g.layerManager.contexts.mapDecor,
                g.layerManager.contexts.entity
            );
        } else if (g.gameState.currentState === 'COMBAT') {
            g.combatEngine.render();
        }
        if (g.uiManager) g.uiManager.updateUI(g.gameState);
    }
}
