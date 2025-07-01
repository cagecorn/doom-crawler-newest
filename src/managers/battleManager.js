// src/managers/battleManager.js

import { MicroEngine } from '../micro/MicroEngine.js';
import { EventManager } from './eventManager.js';

export class BattleManager {
    constructor(game, eventManager, groupManager, entityManager, factory) {
        this.game = game;
        if (!eventManager || typeof eventManager.subscribe !== 'function') {
            console.warn('[BattleManager] Provided eventManager is invalid; using a new instance');
            this.eventManager = new EventManager();
        } else {
            this.eventManager = eventManager;
        }
        this.groupManager = groupManager;
        this.entityManager = entityManager;
        this.factory = factory;
        this.battleInstance = null;
        this.lastCombatants = null;

        console.log('[BattleManager] Initialized');

        this.eventManager.subscribe('combat_started', ({ attacker, defender }) => {
            this.prepareAndStartBattle(attacker, defender);
        });
    }

    prepareAndStartBattle(attacker, defender) {
        console.log(`[BattleManager] Combat event received between ${attacker.id} and ${defender.id}`);
        this.game.isPaused = true;

        const attackerGroupMembers = this.groupManager.getGroupMembers(attacker.groupId);
        const defenderGroupMembers = this.groupManager.getGroupMembers(defender.groupId);

        if (!attackerGroupMembers || !defenderGroupMembers) {
            console.error('[BattleManager] One or both combatants do not have a valid group.');
            this.game.isPaused = false;
            return;
        }

        this.lastCombatants = { attacker, defender };

        this.game.showBattleMap();

        this.battleInstance = new MicroEngine(
            this.game.getBattleCanvasContext(),
            this.game.assets,
            this.eventManager,
            this.factory,
            attackerGroupMembers,
            defenderGroupMembers
        );
        this.battleInstance.start();
    }

    // cleanup battle instance after result processing
    cleanupBattle() {
        if (this.battleInstance) {
            this.battleInstance.stop();
            this.battleInstance = null;
            console.log('[BattleManager] 전투 인스턴스를 정리했습니다.');
        }
        this.lastCombatants = null;
    }

    /* endBattle(result) {
        console.log('[BattleManager] Battle ended. Result:', result);
        if (this.battleInstance) {
            this.battleInstance.stop();
            this.battleInstance = null;
        }
        this.game.showWorldMap();
        this.game.isPaused = false;
        this.lastCombatants = null;
    } */
}
