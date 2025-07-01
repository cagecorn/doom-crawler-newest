// src/game.js

import { SETTINGS } from '../config/gameSettings.js';
import { GameController } from './gameController.js';
import { InputHandler } from './inputHandler.js';
import { CharacterFactory, ItemFactory } from './factory.js';
import { EventManager } from './managers/eventManager.js';
import { CombatLogManager, SystemLogManager } from './managers/logManager.js';
import { CombatCalculator } from './combat.js';
import { TagManager } from './managers/tagManager.js';
import { WorldEngine } from './worldEngine.js';
import { MapManager } from './map.js';
import { AquariumMapManager } from './aquariumMap.js';
import { AquariumManager, AquariumInspector } from './managers/aquariumManager.js';
import * as Managers from './managers/index.js'; // managers/index.js에서 모든 매니저를 한 번에 불러옴
import { ReputationManager } from './managers/ReputationManager.js';
import { GameAssetLoader } from './loaders/gameAssetLoader.js';
import { MetaAIManager, STRATEGY } from './managers/ai-managers.js';
import { SaveLoadManager } from './managers/saveLoadManager.js';
import { LayerManager } from './managers/layerManager.js';
// 기존 인벤토리 함수는 InventoryManager에서 대체합니다.
import { InventoryManager } from './managers/inventoryManager.js';
import { PathfindingManager } from './managers/pathfindingManager.js';
import { MovementManager } from './managers/movementManager.js';
import { WorldMapAIManager } from './managers/worldMapAIManager.js';
import { FogManager } from './managers/fogManager.js';
import { NarrativeManager } from './managers/narrativeManager.js';
import { TurnManager } from './managers/turnManager.js';
import { EntityManager } from './managers/entityManager.js';
import { KnockbackEngine } from './systems/KnockbackEngine.js';
import { SupportEngine } from './systems/SupportEngine.js';
import { SKILLS } from './data/skills.js';
import { EFFECTS } from './data/effects.js';
import { ITEMS } from './data/items.js';
import { Item } from './entities.js';
import { rollOnTable } from './utils/random.js';
import { getMonsterLootTable } from './data/tables.js';
import { MicroEngine } from './micro/MicroEngine.js';
import { MicroCombatManager } from './micro/MicroCombatManager.js';
import { MicroItemAIManager } from './managers/microItemAIManager.js';
import { BattleManager } from './managers/battleManager.js';
import { BattleResultManager } from './managers/battleResultManager.js';

import { StatusEffectsManager } from './managers/statusEffectsManager.js';
import { disarmWorkflow, armorBreakWorkflow } from './workflows.js';
import { PossessionAIManager } from './managers/possessionAIManager.js';
import { Ghost } from './entities.js';
import { TankerGhostAI, RangedGhostAI, SupporterGhostAI, CCGhostAI } from './ai.js';
import { EMBLEMS } from './data/emblems.js';
import { adjustMonsterStatsForAquarium } from './utils/aquariumUtils.js';
import DataRecorder from './managers/dataRecorder.js';
import GuidelineLoader from './managers/guidelineLoader.js';
import { AspirationManager } from './managers/aspirationManager.js';
import { MicroWorldWorker } from './micro/MicroWorldWorker.js';
import { CinematicManager } from './managers/cinematicManager.js';
import { ItemTracker } from './managers/itemTracker.js';
import { findEntitiesInRadius } from './utils/entityUtils.js';
import { LaneManager } from './managers/laneManager.js';
import { LaneRenderManager } from './managers/laneRenderManager.js';
import { LanePusherAI } from './ai/archetypes.js';
import { LaneAssignmentManager } from './managers/laneAssignmentManager.js';
import { FormationManager } from './managers/formationManager.js';
import { TooltipManager } from './managers/tooltipManager.js';
import { CombatEngine } from "./engines/CombatEngine.js";
import { MovementEngine } from './engines/movementEngine.js';
import { GridRenderer } from './renderers/gridRenderer.js';
import { GroupManager } from './managers/groupManager.js';
import { CommanderManager } from './managers/commanderManager.js';
import { WorldmapRenderManager } from './rendering/worldMapRenderManager.js';
import { ManagerFactory } from './managerFactory.js';

export class Game {
    constructor() {
        this.loader = new GameAssetLoader();
        this.gameState = { currentState: 'LOADING' };
        this.battleCanvas = document.getElementById('battleCanvas');
        this.battleCtx = this.battleCanvas.getContext('2d');
        this.aquarium = document.getElementById('aquarium');
        this.isPaused = false;
    }

    start() {
        this.loader.loadAll();
        this.loader.onReady(assets => this.init(assets));
    }

    init(assets) {
        this.assets = assets;
        this.layerManager = new LayerManager(SETTINGS.ENABLE_WEBGL_RENDERER);
        const canvas = this.layerManager.layers.mapBase;
        ManagerFactory.initialize(this, assets);
        this.setupEventListeners(assets, canvas);
        this.showWorldMap();
        this.controller = new GameController(this);
        this.controller.start();
    }

    setupEventListeners(assets, canvas) {
        const { eventManager, combatCalculator, monsterManager, mercenaryManager, mapManager, metaAIManager, pathfindingManager } = this;
        const gameState = this.gameState;

        // 월드맵과 전투 상태 전환 이벤트 처리
        eventManager.subscribe('start_combat', (data) => {
            console.log(`전투 준비! 상대 부대 규모: ${data.monsterParty.troopSize}`);
            gameState.currentState = 'FORMATION_SETUP';
            this.pendingMonsterParty = data.monsterParty;
            this.uiManager.showPanel('squad-management-ui');
            this.worldEngine.monsters.forEach(m => m.isActive = false);
        });

        eventManager.subscribe('formation_confirmed', () => {
            const origin = { x: gameState.player.x, y: gameState.player.y };
            const entityMap = { [gameState.player.id]: gameState.player };
            this.mercenaryManager.mercenaries.forEach(m => { entityMap[m.id] = m; });
            this.formationManager.apply(origin, entityMap);

            // 전투 맵으로 전환하고 실제 전투를 시작한다
            this.showBattleMap();
            this.eventManager.publish('combat_started', {
                attacker: gameState.player,
                defender: this.pendingMonsterParty
            });
            this.pendingMonsterParty = null;

            gameState.currentState = 'COMBAT';
        });

        eventManager.subscribe('end_combat', (result) => {
            console.log(`전투 종료! 결과: ${result.outcome}`);
            gameState.currentState = 'WORLD';
            if (result.outcome === 'victory') {
                this.worldEngine.monsters = this.worldEngine.monsters.filter(m => m.isActive === false);
            }
            this.worldEngine.monsters.forEach(m => m.isActive = true);
        });

        // 공격 이벤트 처리
        eventManager.subscribe('entity_attack', (data) => {
            this.microCombatManager.resolveAttack(data.attacker, data.defender);
            combatCalculator.handleAttack(data, { knockbackEngine: this.knockbackEngine });

            const { attacker, defender, skill } = data;
            if (!skill || !skill.projectile) {
                const img = assets['strike-effect'];
                if (img) {
                    this.vfxManager.addSpriteEffect(
                        img,
                        defender.x + defender.width / 2,
                        defender.y + defender.height / 2,
                        {
                            width: defender.width,
                            height: defender.height,
                            blendMode: 'screen'
                        }
                    );
                    this.vfxManager.addParticleBurst(
                        defender.x + defender.width / 2,
                        defender.y + defender.height / 2,
                        { color: 'rgba(200,0,0,0.9)', count: 12 }
                    );
                }
            }
        });

        // 'charge_hit' 이벤트 리스너 추가
        eventManager.subscribe('charge_hit', (data) => {
            const { attacker, defender } = data;
            if (!defender || defender.hp <= 0) return;

            // 1. 피해를 입힙니다.
            this.handleAttack(attacker, defender, { name: '돌진' });
            
            // 2. 에어본 효과를 적용합니다.
            this.effectManager.addEffect(defender, 'airborne');

            this.eventManager.publish('log', { message: `\uD83D\uDCA8 ${defender.constructor.name}를 공중에 띄웠습니다!`, color: 'lightblue' });
        });

        // 기존의 knockback_request 이벤트는 KnockbackEngine으로 대체되었습니다.

        // 피해량 계산 완료 이벤트를 받아 실제 피해 적용
        eventManager.subscribe('damage_calculated', (data) => {
            data.defender.takeDamage(data.damage);
            eventManager.publish('entity_damaged', { attacker: data.attacker, defender: data.defender, damage: data.damage });
            if (data.defender.hp <= 0) {
                eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
            }
        });

        eventManager.subscribe('entity_damaged', (data) => {
            this.vfxManager.flashEntity(data.defender);

            // 수면 상태인지 확인
            const sleepEffect = data.defender.effects.find(e => e.id === 'sleep');
            if (sleepEffect) {
                const hitsToWake = sleepEffect.wakeUpOnHit || 1;
                sleepEffect.hitsTaken = (sleepEffect.hitsTaken || 0) + 1;

                if (sleepEffect.hitsTaken >= hitsToWake) {
                    this.effectManager.removeEffect(data.defender, sleepEffect);
                    this.eventManager.publish('log', { message: `\uD83D\uDCA4 ${data.defender.constructor.name}\uC774(가) 공격을 받고 깨어났습니다!`, color: 'yellow' });
                }
            }
        });

        // 평판 시스템을 위한 몬스터 처치 이벤트
        eventManager.subscribe('monster_defeated', (data) => {
            if (!this.reputationManager) return;
            const action = {
                type: 'combat',
                outcome: 'victory',
                enemy: data.monster.type
            };
            this.reputationManager.handleGameEvent(action);
        });

        // 죽음 이벤트가 발생하면 경험치 획득 및 애니메이션을 시작
        eventManager.subscribe('entity_death', (data) => {
            const { attacker, victim } = data;

            victim.isDying = true;
            this.vfxManager.addDeathAnimation(victim, 'explode');

            eventManager.publish('log', { message: `${victim.constructor.name}가 쓰러졌습니다.`, color: 'red' });

            if (victim.unitType === 'monster') {
                this.eventManager.publish('monster_defeated', { monster: victim, attacker });
                const dropPool = [];
                if (victim.consumables) dropPool.push(...victim.consumables);
                if (victim.equipment) {
                    for (const slot in victim.equipment) {
                        const it = victim.equipment[slot];
                        if (it) dropPool.push(it);
                    }
                }
                const dropCount = Math.min(dropPool.length, Math.floor(Math.random() * 6));
                for (let i = 0; i < dropCount; i++) {
                    const idx = Math.floor(Math.random() * dropPool.length);
                    const item = dropPool.splice(idx, 1)[0];
                    const startPos = { x: victim.x, y: victim.y };
                    const endPos = this.findRandomEmptyAdjacentTile(victim.x, victim.y) || startPos;
                    item.x = endPos.x;
                    item.y = endPos.y;
                    this.itemManager.addItem(item);
                    this.vfxManager.addItemPopAnimation(item, startPos, endPos);
                }
            }

            if (!victim.isFriendly && (attacker.isPlayer || attacker.isFriendly)) {
                if (attacker.isPlayer) {
                    // 플레이어가 직접 처치한 경우 전체 경험치 지급
                    eventManager.publish('exp_gained', { player: attacker, exp: victim.expValue });
                } else if (attacker.isFriendly) {
                    // 용병이 처치한 경우 용병과 플레이어가 경험치를 절반씩 나눔
                    const sharedExp = victim.expValue / 2;
                    eventManager.publish('exp_gained', { player: attacker, exp: sharedExp });
                    eventManager.publish('exp_gained', { player: gameState.player, exp: sharedExp });
                }
            }

            // 몬스터 시체 생성
            if (victim.unitType === 'monster' && assets.corpse) {
                const corpse = new Item(
                    victim.x,
                    victim.y,
                    this.mapManager.tileSize,
                    'corpse',
                    assets.corpse
                );
                corpse.bobbingSpeed = 0;
                corpse.bobbingAmount = 0;
                corpse.baseY = victim.y;
                this.itemManager.addItem(corpse);
            }
        });

        // 게임오버 이벤트 구독 추가
        eventManager.subscribe('game_over', () => {
            gameState.isGameOver = true;
            alert("게임 오버!");
            this.combatLogManager.add('%c게임 오버!');
        });

        eventManager.subscribe('exp_gained', (data) => {
            const { player, exp } = data;
            player.stats.addExp(exp);
        });

        eventManager.subscribe('player_levelup_bonus', (data) => {
            this.gameState.statPoints += data.statPoints;
        });


        eventManager.subscribe('weapon_disarmed', (data) => {
            if (data.weapon) {
                const context = {
                    eventManager: this.eventManager,
                    itemManager: this.itemManager,
                    equipmentManager: this.equipmentManager,
                    vfxManager: this.vfxManager,
                    mapManager: this.mapManager,
                    ...data
                };
                disarmWorkflow(context);
            }
        });

        eventManager.subscribe('armor_broken', (data) => {
            if (data.armor) {
                const context = {
                    eventManager: this.eventManager,
                    equipmentManager: this.equipmentManager,
                    vfxManager: this.vfxManager,
                    ...data
                };
                armorBreakWorkflow(context);
            }
        });

        // 미시세계 판정 결과 텍스트 및 추가 연출
        eventManager.subscribe('micro_world_event', ({ type, entity }) => {
            if (!entity) return;
            if (type === 'disarm') {
                this.vfxManager.showEventText('[무장해제!]');
            } else if (type === 'armor_break') {
                this.vfxManager.showEventText('[방어구 파괴!]');
            }
        });

        // 스킬 사용 로직은 SkillManager로 이동되었습니다.


        // AI가 성격 특성을 발동했을 때 텍스트 팝업으로 표시
        eventManager.subscribe('ai_mbti_trait_triggered', (data) => {
            if (this.vfxManager) {
                const text = data.tfUsed ? `${data.trait}(tf)` : data.trait;
                this.vfxManager.addTextPopup(text, data.entity);
            }
        });

        // 스탯 변경 이벤트 구독 (효과 적용/해제 시 스탯 재계산)
        eventManager.subscribe('stats_changed', (data) => {
            data.entity.stats.recalculate();
        });

        // 인벤토리 업데이트 시 UI를 새로 고칩니다.

        eventManager.subscribe('key_pressed', (data) => {
            const key = data.key;
            if (gameState.isPaused || gameState.isGameOver) return;

            if (['1', '2', '3', '4'].includes(key)) {
                const skillIndex = parseInt(key) - 1;
                const player = gameState.player;
                const skillId = player.skills[skillIndex];

                if (skillId && (player.skillCooldowns[skillId] || 0) <= 0) {
                    const skillData = SKILLS[skillId];
                    if (player.mp >= skillData.manaCost) {
                        player.mp -= skillData.manaCost;
                        player.skillCooldowns[skillId] = skillData.cooldown;
                        eventManager.publish('skill_used', { caster: player, skill: skillData, target: null });
                    } else {
                        eventManager.publish('log', { message: '마나가 부족합니다.' });
                    }
                }
            }
        });

        eventManager.subscribe('mouse_wheel', (data) => {
            if (gameState.isPaused || gameState.isGameOver) return;
            const step = 0.1;
            if (data.direction < 0) {
                gameState.zoomLevel = Math.min(2, gameState.zoomLevel + step);
            } else if (data.direction > 0) {
                gameState.zoomLevel = Math.max(0.25, gameState.zoomLevel - step);
            }
        });

        this.uiManager.init({
            onStatUp: this.handleStatUp,
            onItemUse: (itemIndex) => {
                const item = gameState.inventory[itemIndex];
                if (!item) return;

                if (item.baseId === 'potion' || item.name === 'potion') {
                    const playerChar = gameState.player;
                    playerChar.hp = Math.min(playerChar.maxHp, playerChar.hp + 5);
                    this.particleDecoratorManager.playHealingEffect(playerChar);
                    if (item.quantity > 1) {
                        item.quantity -= 1;
                    } else {
                        gameState.inventory.splice(itemIndex, 1);
                    }
                } else if (item.tags.includes('pet') || item.type === 'pet') {
                    this.petManager.equip(gameState.player, item, 'fox');
                } else {
                    const slot = this.inventoryManager.engine.getPreferredSlot(item);
                    if (slot) {
                        this.inventoryManager.engine.moveItem(
                            { entity: gameState.player, slot: 'inventory', index: itemIndex },
                            { entity: gameState.player, slot, index: 0 }
                        );
                    }
                }
                this.uiManager.renderInventory(gameState);
            },
            onConsumableUse: (itemIndex) => {
                const item = gameState.player.consumables[itemIndex];
                if (!item) return;

                if (item.baseId === 'potion' || item.tags?.includes('healing_item')) {
                    const playerChar = gameState.player;
                    playerChar.hp = Math.min(playerChar.maxHp, playerChar.hp + 5);
                    this.particleDecoratorManager.playHealingEffect(playerChar);
                    gameState.player.consumables.splice(itemIndex, 1);
                } else if (item.tags.includes('buff_item')) {
                    this.effectManager.addEffect(gameState.player, item.effectId);
                    gameState.player.consumables.splice(itemIndex, 1);
                } else if (item.tags.includes('pet') || item.type === 'pet') {
                    this.petManager.equip(gameState.player, item, 'fox');
                } else {
                    gameState.player.consumables.splice(itemIndex, 1);
                }
                this.uiManager.updateUI(gameState);
            },
            onEquipItem: (entity, item) => {
                const fromIdx = gameState.inventory.indexOf(item);
                if (fromIdx === -1) return;
                const slot = this.inventoryManager.engine.getPreferredSlot(item);
                if (!slot) return;
                this.inventoryManager.engine.moveItem(
                    { entity: gameState.player, slot: 'inventory', index: fromIdx },
                    { entity, slot, index: 0 }
                );
                this.uiManager.renderInventory(gameState);
                const panel = this.uiManager.openCharacterSheets.get(entity.id);
                if (panel) this.uiManager.renderCharacterSheet(entity, panel);
            }
        });

        // 닫기 버튼 공통 로직 수정
        document.querySelectorAll('.close-btn').forEach(button => {
            button.onclick = () => {
                const panel = button.closest('.modal-panel');
                if (panel) panel.classList.add('hidden');
                this.gameState.isPaused = false;
            };
        });

        // === 캔버스 클릭 이벤트 추가 (가장 상단 weather-canvas에 연결) ===
        this.layerManager.layers.weather.addEventListener('click', (event) => {
            if (gameState.isGameOver) return;

            const rect = this.layerManager.layers.weather.getBoundingClientRect();
            const scale = gameState.zoomLevel;
            const worldX = (event.clientX - rect.left) / scale + gameState.camera.x;
            const worldY = (event.clientY - rect.top) / scale + gameState.camera.y;

            const clickedMerc = [...mercenaryManager.mercenaries].reverse().find(merc =>
                worldX >= merc.x && worldX <= merc.x + merc.width &&
                worldY >= merc.y && worldY <= merc.y + merc.height
            );

            if (clickedMerc) {
                if (this.mercenaryManager.showMercenaryDetail) {
                    this.mercenaryManager.showMercenaryDetail(clickedMerc);
                    this.gameState.isPaused = true;
                }
                return; // 용병을 클릭했으면 더 이상 진행 안 함
            }

            const clickedMonster = [...monsterManager.monsters].reverse().find(mon =>
                worldX >= mon.x && worldX <= mon.x + mon.width &&
                worldY >= mon.y && worldY <= mon.y + mon.height
            );

            if (clickedMonster) {
                if (this.uiManager.displayCharacterSheet) {
                    this.uiManager.displayCharacterSheet(clickedMonster);
                    this.gameState.isPaused = true;
                }
                return;
            }
        });

        const weatherLayer = this.layerManager.layers.weather;
        weatherLayer.addEventListener('mousedown', (e) => {
            if (this.gameState.currentState === 'WORLD') {
                this.worldEngine.startDrag(e.clientX, e.clientY);
            } else if (this.gameState.currentState === 'COMBAT') {
                this.startDragCamera(e.clientX, e.clientY);
            }
        });
        weatherLayer.addEventListener('mousemove', (e) => {
            if (this.gameState.currentState === 'WORLD') {
                this.worldEngine.drag(e.clientX, e.clientY);
            } else if (this.gameState.currentState === 'COMBAT') {
                this.dragCamera(e.clientX, e.clientY);
            }
        });
        ['mouseup', 'mouseleave'].forEach(ev => {
            weatherLayer.addEventListener(ev, () => {
                if (this.gameState.currentState === 'WORLD') {
                    this.worldEngine.endDrag();
                } else if (this.gameState.currentState === 'COMBAT') {
                    this.endDragCamera();
                }
            });
        });
    }

    findNearestEnemy(caster, enemies, range = Infinity) {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dx = enemy.x - caster.x;
            const dy = enemy.y - caster.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minDist && dist <= range) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    update = (deltaTime) => {
        if (this.gameState.currentState === 'WORLD') {
            this.worldEngine.update(deltaTime);
            if (this.worldMapAIManager) {
                this.worldMapAIManager.update(deltaTime);
            }
            return;
        } else if (this.gameState.currentState === 'FORMATION_SETUP') {
            return;
        } else if (this.gameState.currentState !== 'COMBAT') {
            return;
        }

        this.combatEngine.update(deltaTime);
    }
    render = () => {
        this.layerManager.clear();
        if (this.gameState.currentState === "WORLD") {
            this.worldEngine.render(
                this.layerManager.contexts.mapBase,
                this.layerManager.contexts.mapDecor,
                this.layerManager.contexts.entity
            );
        } else if (this.gameState.currentState === "COMBAT") {
            this.combatEngine.render();
        }
        if (this.uiManager) this.uiManager.updateUI(this.gameState);
    }

    handleAttack(attacker, defender, skill = null) {
        this.eventManager.publish('entity_attack', { attacker, defender, skill });
    }

    startDragCamera(screenX, screenY) {
        const { cameraDrag, gameState } = this;
        cameraDrag.isDragging = true;
        cameraDrag.followPlayer = false;
        cameraDrag.dragStart.x = screenX;
        cameraDrag.dragStart.y = screenY;
        cameraDrag.cameraStart.x = gameState.camera.x;
        cameraDrag.cameraStart.y = gameState.camera.y;
    }

    dragCamera(screenX, screenY) {
        const { cameraDrag, gameState, layerManager, mapManager } = this;
        if (!cameraDrag.isDragging) return;
        const zoom = gameState.zoomLevel || 1;
        const deltaX = (screenX - cameraDrag.dragStart.x) / zoom;
        const deltaY = (screenY - cameraDrag.dragStart.y) / zoom;
        gameState.camera.x = cameraDrag.cameraStart.x - deltaX;
        gameState.camera.y = cameraDrag.cameraStart.y - deltaY;
        const canvas = layerManager.layers.mapBase;
        const mapPixelWidth = mapManager.width * mapManager.tileSize;
        const mapPixelHeight = mapManager.height * mapManager.tileSize;
        gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, mapPixelWidth - canvas.width / zoom));
        gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, mapPixelHeight - canvas.height / zoom));
    }

    endDragCamera() {
        this.cameraDrag.isDragging = false;
    }

    // 플레이어와 모든 고용된 용병을 포함하는 파티 목록을 반환합니다.
    getPartyMembers() {
        const party = [this.player];
        const mercenaries = this.mercenaryManager.getHiredMercenaries();
        return party.concat(mercenaries);
    }

    handleCameraReset() {
        if (!this.cameraDrag.followPlayer && Object.keys(this.inputHandler.keysPressed).length > 0) {
            this.cameraDrag.followPlayer = true;
            this.cameraDrag.isDragging = false;
        }
    }


    /**
     * 지정된 좌표 인근의 비어 있는 임의 타일을 찾는다.
     * @param {number} centerX
     * @param {number} centerY
     * @returns {{x:number,y:number}|null}
     */
    findRandomEmptyAdjacentTile(centerX, centerY) {
        const tileSize = this.mapManager.tileSize;
        const baseX = Math.floor(centerX / tileSize);
        const baseY = Math.floor(centerY / tileSize);
        const dirs = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 },                   { x: 1, y: 0 },
            { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
        ];
        dirs.sort(() => Math.random() - 0.5);

        const entities = [
            this.gameState.player,
            ...this.mercenaryManager.mercenaries,
            ...this.monsterManager.monsters,
        ];

        for (const d of dirs) {
            const tileX = baseX + d.x;
            const tileY = baseY + d.y;
            const worldX = tileX * tileSize;
            const worldY = tileY * tileSize;
            if (this.mapManager.isWallAt(worldX, worldY)) continue;

            const occupied = entities.some(e => {
                const ex = Math.floor(e.x / tileSize);
                const ey = Math.floor(e.y / tileSize);
                return ex === tileX && ey === tileY;
            });
            if (!occupied) {
                return { x: worldX, y: worldY };
            }
        }
        return null;
    }

    handleStatUp = (stat) => {
        if (this.gameState.statPoints > 0) {
            this.gameState.statPoints--;
            this.gameState.player.stats.allocatePoint(stat);
            this.gameState.player.stats.recalculate();
        }
    }

    startBGM() {
        if (this.bgmManager && !this.bgmManager.isInitialized) {
            this.bgmManager.start();
        }
    }

    getBattleCanvasContext() {
        return this.battleCtx;
    }

    showWorldMap() {
        const container = document.getElementById('canvas-container');
        container.style.display = 'block';
        this.battleCanvas.style.display = 'none';
        this.aquarium.style.display = 'none';
    }

    showBattleMap() {
        const container = document.getElementById('canvas-container');
        container.style.display = 'none';
        this.battleCanvas.style.display = 'block';
        this.aquarium.style.display = 'none';
    }
}
