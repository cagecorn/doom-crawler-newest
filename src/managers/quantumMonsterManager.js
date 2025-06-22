export class QuantumMonsterManager {
    /**
     * @param {object} monsterManager - 활성화된 몬스터를 관리할 MonsterManager 인스턴스
     * @param {object} player - 플레이어 객체
     * @param {object} [monsterGroup] - 메타 AI 그룹
     */
    constructor(monsterManager, player, monsterGroup = null) {
        if (!monsterManager || !player) {
            throw new Error("QuantumMonsterManager requires MonsterManager and Player instances.");
        }
        this.monsterManager = monsterManager;
        this.player = player;
        this.monsterGroup = monsterGroup;

        // 아직 월드에 등장하지 않은 모든 몬스터의 데이터를 저장합니다.
        // { monsterData, initialX, initialY } 형태의 객체를 저장합니다.
        this.quantumMonsters = [];

        // 활성화된 몬스터와 그 원본 데이터의 인덱스를 매핑합니다.
        this.activeMonsterMap = new Map(); // key: monster.id, value: quantumMonsters index

        console.log('[QuantumMonsterManager] Initialized');
    }

    /**
     * 초기에 모든 몬스터를 양자 상태로 추가합니다.
     * @param {Array<object>} monsterConfigs - 몬스터 생성에 필요한 설정 객체 배열
     */
    initializeMonsters(monsterConfigs) {
        this.quantumMonsters = monsterConfigs.map(config => ({
            monsterData: config, // 나중에 팩토리로 생성할 데이터
            initialX: config.x,
            initialY: config.y,
            isSpawned: false, // 실제 월드에 스폰되었는지 여부
        }));
    }

    /**
     * 매 프레임마다 플레이어 주변을 확인하여 몬스터를 활성화/비활성화합니다.
     */
    update() {
        const playerVisionRange = this.player.visionRange || 192 * 4;

        // 1. 비활성화된 몬스터 중 플레이어 시야에 들어온 몬스터를 활성화합니다.
        this.quantumMonsters.forEach((quantumMonster, index) => {
            if (quantumMonster.isSpawned) return;

            const distance = Math.hypot(quantumMonster.initialX - this.player.x, quantumMonster.initialY - this.player.y);
            if (distance <= playerVisionRange) {
                this._activateMonster(index);
            }
        });

        // 2. 활성화된 몬스터 중 시야 밖으로 나간 몬스터를 비활성화합니다.
        const activeMonsters = [...this.monsterManager.monsters]; // 복사본으로 작업
        activeMonsters.forEach(monster => {
            if (!this.activeMonsterMap.has(monster.id)) return; // 이 매니저가 관리하는 몬스터가 아니면 건너뜀

            const distance = Math.hypot(monster.x - this.player.x, monster.y - this.player.y);
            if (distance > playerVisionRange * 1.2) {
                this._deactivateMonster(monster);
            }
        });
    }

    /**
     * 특정 몬스터를 활성화하여 MonsterManager로 넘깁니다.
     * @param {number} index - this.quantumMonsters 배열의 인덱스
     * @private
     */
    _activateMonster(index) {
        const quantumMonster = this.quantumMonsters[index];
        if (quantumMonster.isSpawned) return;

        const monster = this.monsterManager.factory.create('monster', quantumMonster.monsterData);
        if (!monster) return;

        if (quantumMonster.monsterData.hp) {
            monster.hp = quantumMonster.monsterData.hp;
        }

        this.monsterManager.monsters.push(monster);
        if (this.monsterGroup) this.monsterGroup.addMember(monster);
        quantumMonster.isSpawned = true;
        this.activeMonsterMap.set(monster.id, index);
        console.log(`[Quantum] Monster ${monster.id.substr(0, 4)} activated.`);
    }

    /**
     * 특정 몬스터를 비활성화하여 데이터만 남깁니다.
     * @param {object} monster - 비활성화할 몬스터 객체
     * @private
     */
    _deactivateMonster(monster) {
        const index = this.activeMonsterMap.get(monster.id);
        if (index === undefined) return;

        const quantumMonster = this.quantumMonsters[index];
        quantumMonster.monsterData.hp = monster.hp;

        this.monsterManager.removeMonster(monster.id);
        if (this.monsterGroup) this.monsterGroup.removeMember(monster.id);

        quantumMonster.isSpawned = false;
        this.activeMonsterMap.delete(monster.id);
        console.log(`[Quantum] Monster ${monster.id.substr(0, 4)} deactivated.`);
    }
}
