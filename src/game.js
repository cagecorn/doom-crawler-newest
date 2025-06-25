import { Entity } from './entity.js';
import { MeleeAI, RangedAI } from './ai.js';
import { MetaAIManager, STRATEGY } from './metaAi.js';
import { FormationManager } from './managers/formationManager.js';
import { eventManager } from './managers/eventManager.js';
import { squadManager } from './managers/squadManager.js';
import { uiManager } from './managers/uiManager.js';

const TILE_SIZE = 64;

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = {};
        this.player = null;
        this.metaAIManager = new MetaAIManager();

        // 게임 상태 관리
        this.state = 'IDLE'; // IDLE, FORMATION_SETUP, COMBAT

        // 플레이어 및 적 진형 관리자 생성
        this.playerFormationManager = new FormationManager(5, 5, TILE_SIZE);
        this.enemyFormationManager = new FormationManager(5, 5, TILE_SIZE);
    }

    // 게임 상태 변경 및 이벤트 발행
    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        console.log(`Game state changed to: ${newState}`);
        eventManager.publish('game_state_changed', newState);
    }

    start() {
        this.initPlayer();
        this.initMercenaries(); // 아군 용병 생성
        this.initEnemySquads(); // 적군 분대 생성

        // --- UI 초기화 ---
        squadManager.createSquad('A분대');
        squadManager.createSquad('B분대');
        squadManager.createSquad('C분대');

        const friendlyEntities = Object.values(this.entities).filter(e => e.faction === 'player');
        uiManager.createSquadManagementUI(friendlyEntities, squadManager.getSquads());
        uiManager.createFormationGridUI(squadManager.getSquads());

        this.setState('FORMATION_SETUP');

        const startButton = document.createElement('button');
        startButton.textContent = '전투 시작!';
        startButton.onclick = () => {
            if (this.state === 'FORMATION_SETUP') {
                this.setState('COMBAT');
                this.placeUnitsForCombat();
                startButton.style.display = 'none';
            }
        };
        document.body.appendChild(startButton);

        this.gameLoop();
    }

    // 전투 시작 시 유닛 배치
    placeUnitsForCombat() {
        console.log('Placing units for combat...');
        // 플레이어 유닛 배치
        this.playerFormationManager.apply({ x: 100, y: 300 }, this.entities, squadManager);

        // 적 유닛 배치
        this.enemyFormationManager.apply({ x: 800, y: 300 }, this.entities, squadManager);
    }

    initPlayer() {
        this.player = new Entity(100, 300, 10, 'player', 'Player', 'player', 100, 1);
        this.entities[this.player.id] = this.player;
    }

    initMercenaries() {
        // 플레이어 소속 용병 생성
        for (let i = 0; i < 10; i++) {
            const mercenary = new Entity(0, 0, 10, `mercenary_${i}`, `용병 ${i}`, 'player', 80, 1);
            this.entities[mercenary.id] = mercenary;
        }
    }

    initEnemySquads() {
        const enemySquad = squadManager.createSquad('적 1분대');
        const enemyMonsterGroup = this.metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE, this.player);

        for (let i = 0; i < 50; i++) {
            const monster = new Entity(0, 0, 8, `monster_${i}`, 'Monster', 'enemy', 50, 1);
            monster.ai = new MeleeAI(monster, Object.values(this.entities));
            this.entities[monster.id] = monster;
            squadManager.handleAssignMember({ entityId: monster.id, squadId: enemySquad.id });
            enemyMonsterGroup.add(monster);
        }

        this.enemyFormationManager.handleAssignSquad({ squadId: enemySquad.id, slotIndex: 12 });
    }

    update(dt) {
        if (this.state !== 'COMBAT') return;

        Object.values(this.entities).forEach(entity => {
            entity.update(dt);
        });

        this.metaAIManager.update(dt);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        Object.values(this.entities).forEach(entity => {
            entity.draw(this.ctx);
        });
    }

    gameLoop() {
        const lastTime = 0;
        const animate = (timestamp) => {
            const dt = (timestamp - lastTime) / 1000;
            this.update(dt);
            this.draw();
            requestAnimationFrame(animate);
        };
        animate(0);
    }
}

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
game.start();
