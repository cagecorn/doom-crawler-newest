import { MicroTurnManager } from './MicroTurnManager.js';
import { TimerManager } from '../managers/timerManager.js';

// src/micro/MicroEngine.js

// MicroEngine handles the micro-world progression. It listens for combat events
// and updates weapon experience and proficiency accordingly.
export class MicroEngine {
    constructor(arg1, arg2, arg3, arg4, arg5, arg6) {
        if (arg2 === undefined && arg3 === undefined && arg4 === undefined) {
            // legacy signature: constructor(eventManager)
            this.eventManager = arg1;
            this.ctx = null;
            this.assets = null;
            this.factory = null;
            this.playerUnits = [];
            this.enemyUnits = [];
        } else {
            // new signature: constructor(ctx, assets, eventManager, factory, playerUnits, enemyUnits)
            this.ctx = arg1;
            this.assets = arg2;
            this.eventManager = arg3;
            this.factory = arg4;
            this.playerUnits = arg5 || [];
            this.enemyUnits = arg6 || [];
        }

        this.turnManager = new MicroTurnManager();

        const BATTLE_DURATION = 30;
        this.timerManager = new TimerManager(BATTLE_DURATION, () => this.endBattleByTimeout());
        this.isRunning = false;
        this.lastTime = 0;

        if (this.eventManager) {
            this.eventManager.subscribe('attack_landed', data => this.handleAttackLanded(data));
        }
        console.log('[MicroEngine] Initialized and subscribed to events.');
    }

    handleAttackLanded(data) {
        const { attacker } = data;
        const weapon = attacker.equipment?.weapon;

        if (weapon && weapon.weaponStats) {
            // 1. Increase weapon experience
            weapon.weaponStats.gainExp(1);

            // 2. Increase wielder's proficiency for this weapon type
            const weaponType = this._getProficiencyType(weapon.baseId);
            if (weaponType && attacker.proficiency && attacker.proficiency[weaponType]) {
                const prof = attacker.proficiency[weaponType];
                prof.exp++;
                if (prof.exp >= prof.expNeeded) {
                    prof.level++;
                    prof.exp = 0;
                    prof.expNeeded = Math.floor(prof.expNeeded * 1.5);
                    this.eventManager.publish('log', {
                        message: `${attacker.constructor.name}의 ${weaponType} 숙련도가 ${prof.level}레벨이 되었습니다!`,
                        color: 'gold'
                    });
                }
            }
        }
    }

    _getProficiencyType(itemId) {
        if (!itemId) return null;
        if (itemId.includes('sword')) return 'sword';
        if (itemId.includes('dagger')) return 'dagger';
        if (itemId.includes('estoc')) return 'estoc';
        if (itemId.includes('saber')) return 'saber';
        if (itemId.includes('spear')) return 'spear';
        if (itemId.includes('violin_bow')) return 'violin_bow';
        if (itemId.includes('bow')) return 'bow';
        return null;
    }

    start() {
        this.isRunning = true;
        this.timerManager.start();
        this.gameLoop(0);
        console.log('[MicroEngine] Started.');
    }

    stop() {
        this.isRunning = false;
        this.timerManager.stop();
        console.log('[MicroEngine] Stopped.');
    }

    endBattleByTimeout() {
        console.log('[MicroEngine] Battle ended due to timeout.');
        this.stop();

        const battleResult = {
            winner: 'draw',
            loser: 'draw',
            survivors: {
                player: this.playerUnits.filter(u => u.hp > 0),
                enemy: this.enemyUnits.filter(u => u.hp > 0)
            }
        };

        if (this.eventManager) {
            this.eventManager.publish('battle_ended', battleResult);
        }
    }

    // battle ended due to annihilation
    endBattleByAnnihilation(isPlayerWiped, isEnemyWiped) {
        console.log('[MicroEngine] Battle ended due to annihilation.');
        this.stop();

        let winner = 'draw';
        if (isPlayerWiped && !isEnemyWiped) winner = 'enemy';
        if (!isPlayerWiped && isEnemyWiped) winner = 'player';

        const battleResult = {
            winner,
            loser: winner === 'player' ? 'enemy' : (winner === 'enemy' ? 'player' : 'draw'),
            survivors: {
                player: this.playerUnits.filter(u => u.hp > 0),
                enemy: this.enemyUnits.filter(u => u.hp > 0)
            }
        };

        if (this.eventManager) {
            this.eventManager.publish('battle_ended', battleResult);
        }
    }

    gameLoop = (timestamp) => {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - (this.lastTime || timestamp)) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    }

    update(param) {
        if (Array.isArray(param)) {
            // 게임 루프로부터 전달된 아이템 목록을 TurnManager에 위임
            this.turnManager.update(param);
            return;
        }

        const deltaTime = param;
        if (!this.isRunning) return;

        this.timerManager.update(deltaTime);
        // TODO: unit movement and combat updates go here

        // --- annihilation check ---
        const isPlayerArmyWipedOut = this.playerUnits.every(u => u.hp <= 0);
        const isEnemyArmyWipedOut = this.enemyUnits.every(u => u.hp <= 0);

        if (isPlayerArmyWipedOut || isEnemyArmyWipedOut) {
            this.endBattleByAnnihilation(isPlayerArmyWipedOut, isEnemyArmyWipedOut);
            return;
        }
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        // TODO: render units and background here
        this.renderTimer();
    }

    renderTimer() {
        if (!this.ctx) return;
        const time = this.timerManager.getRemainingTime();
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const timerText = `Time Left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(timerText, this.ctx.canvas.width - 20, 20);
    }
}
