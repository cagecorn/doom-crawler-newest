export class BattleResultManager {
    constructor(game, eventManager, groupManager, entityManager) {
        this.game = game;
        this.eventManager = eventManager;
        this.groupManager = groupManager;
        this.entityManager = entityManager;
        this.lastCombatants = null;

        console.log("[BattleResultManager] Initialized");
        this.eventManager.subscribe('combat_started', ({ attacker, defender }) => {
            this.lastCombatants = { attacker, defender };
        });
        this.eventManager.subscribe('battle_ended', (result) => {
            this.processResult(result);
        });
    }

    /**
     * Process battle results and update world map state.
     * @param {object} result - battle result emitted by MicroEngine
     */
    processResult(result) {
        if (!this.lastCombatants) {
            console.error("[BattleResultManager] 전투 참여자 정보가 없습니다.");
            return;
        }

        const { attacker, defender } = this.lastCombatants;
        const { winner, survivors } = result;

        console.log(`[BattleResultManager] 전투 결과 처리 시작. 승자: ${winner}`);

        // Build a set of survivor IDs
        const survivorIds = new Set();
        if (survivors) {
            (survivors.player || []).forEach(u => survivorIds.add(u.id));
            (survivors.enemy || []).forEach(u => survivorIds.add(u.id));
        }

        let losingCommander = null;
        if (winner === 'player' || winner === 'draw') {
            losingCommander = defender;
        }
        if (winner === 'enemy' || winner === 'draw') {
            losingCommander = attacker;
        }

        if (winner !== 'draw' && losingCommander) {
            this.removeDefeatedGroup(losingCommander, survivorIds);
        } else {
            this.updateGroupSurvivors(attacker.groupId, survivorIds);
            this.updateGroupSurvivors(defender.groupId, survivorIds);
        }

        this.eventManager.publish('world_map_updated_after_battle');

        // After processing, return to world map
        console.log("[BattleResultManager] 모든 결과 처리를 마치고 월드맵으로 복귀합니다.");
        if (this.game && this.game.showWorldMap) {
            this.game.showWorldMap();
            this.game.isPaused = false;
        }
        this.lastCombatants = null;
        if (this.game && this.game.battleManager) {
            this.game.battleManager.cleanupBattle();
        }
    }

    /**
     * Remove a defeated group or its fallen members.
     * @param {Entity} commander - defeated commander
     * @param {Set<string>} survivorIds - set of survivor entity IDs
     */
    removeDefeatedGroup(commander, survivorIds) {
        const members = this.groupManager.getGroupMembers(commander.groupId);
        if (survivorIds.has(commander.id)) {
            console.log(`[BattleResultManager] ${commander.id} 부대 일부 생존. 생존자 업데이트.`);
            this.updateGroupSurvivors(commander.groupId, survivorIds);
        } else {
            console.log(`[BattleResultManager] ${commander.id} 부대 전멸. 그룹 전체 제거.`);
            this.groupManager.removeGroup(commander.groupId);

            // 월드맵의 몬스터 배열에서도 제거
            if (this.game.worldEngine && this.game.worldEngine.monsters) {
                const index = this.game.worldEngine.monsters.findIndex(m => m.id === commander.id);
                if (index > -1) {
                    this.game.worldEngine.monsters.splice(index, 1);
                }
            }

            if (this.entityManager.removeEntityById) {
                this.entityManager.removeEntityById(commander.id);
            }
        }
    }

    /**
     * Update a group's members, keeping only survivors.
     * @param {string} groupId - group ID to update
     * @param {Set<string>} survivorIds - set of survivor IDs
     */
    updateGroupSurvivors(groupId, survivorIds) {
        const members = this.groupManager.getGroupMembers(groupId);
        if (!members) return;
        for (const member of members) {
            if (!survivorIds.has(member.id)) {
                console.log(`[BattleResultManager] 사망자 처리: ${member.id}`);
                if (this.groupManager.removeMemberFromGroup) {
                    this.groupManager.removeMemberFromGroup(groupId, member.id);
                }
            }
        }
    }
}
