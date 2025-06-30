// src/game.js

import { SETTINGS } from '../config/gameSettings.js';
import { GameLoop } from './gameLoop.js';
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
import { AssetLoader } from './assetLoader.js';
import { MetaAIManager, STRATEGY } from './managers/ai-managers.js';
import { SaveLoadManager } from './managers/saveLoadManager.js';
import { LayerManager } from './managers/layerManager.js';
// 기존 인벤토리 함수는 InventoryManager에서 대체합니다.
import { InventoryManager } from './managers/inventoryManager.js';
import { PathfindingManager } from './managers/pathfindingManager.js';
import { MovementManager } from './managers/movementManager.js';
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

export class Game {
    constructor() {
        this.loader = new AssetLoader();
        this.gameState = { currentState: 'LOADING' };
    }

    start() {
        this.loader.loadImage('player', 'assets/player.png');
        this.loader.loadImage('monster', 'assets/monster.png');
        this.loader.loadImage('epic_monster', 'assets/epic_monster.png');
        // 병종별 용병 이미지를 로드한다
        this.loader.loadImage('warrior', 'assets/images/warrior.png');
        this.loader.loadImage('archer', 'assets/images/archer.png');
        this.loader.loadImage('healer', 'assets/images/healer.png');
        this.loader.loadImage('wizard', 'assets/images/wizard.png');
        this.loader.loadImage('summoner', 'assets/images/summoner.png');
        this.loader.loadImage('bard', 'assets/images/bard.png');
        // 불의 신 이미지 키를 jobId와 맞춰 'fire_god'으로 로드한다
        this.loader.loadImage('fire_god', 'assets/images/fire-god.png');
        // 기존 호환성을 위해 기본 mercenary 키도 전사 이미지로 유지
        this.loader.loadImage('mercenary', 'assets/images/warrior.png');
        this.loader.loadImage('floor', 'assets/floor.png');
        this.loader.loadImage('wall', 'assets/wall.png');
        this.loader.loadImage('gold', 'assets/gold.png');
        this.loader.loadImage('potion', 'assets/potion.png');
        this.loader.loadImage('sword', 'assets/images/shortsword.png');
        this.loader.loadWeaponImages();
        this.loader.loadImage('shield', 'assets/images/shield.png');
        this.loader.loadImage('bow', 'assets/images/bow.png');
        this.loader.loadImage('arrow', 'assets/images/arrow.png');
        this.loader.loadImage('leather_armor', 'assets/images/leatherarmor.png');
        this.loader.loadImage('plate-armor', 'assets/images/plate-armor.png');
        this.loader.loadImage('iron-helmet', 'assets/images/iron-helmet.png');
        this.loader.loadImage('iron-gauntlets', 'assets/images/iron-gauntlets.png');
        this.loader.loadImage('iron-boots', 'assets/images/iron-boots.png');
        this.loader.loadImage('violin-bow', 'assets/images/violin-bow.png');
        this.loader.loadImage('skeleton', 'assets/images/skeleton.png');
        this.loader.loadImage('pet-fox', 'assets/images/pet-fox.png');
        this.loader.loadImage('guardian-hymn-effect', 'assets/images/Guardian Hymn-effect.png');
        this.loader.loadImage('courage-hymn-effect', 'assets/images/Courage Hymn-effect.png');
        this.loader.loadImage('fire-ball', 'assets/images/fire-ball.png');
        this.loader.loadImage('ice-ball', 'assets/images/ice-ball-effect.png');
        this.loader.loadImage('strike-effect', 'assets/images/strike-effect.png');
        this.loader.loadImage('healing-effect', 'assets/images/healing-effect.png');
        this.loader.loadImage('purify-effect', 'assets/images/purify-effect.png');
        this.loader.loadImage('corpse', 'assets/images/corpse.png');
        this.loader.loadImage('parasite', 'assets/images/parasite.png');
        this.loader.loadImage('leech', 'assets/images/parasite.png');
        this.loader.loadImage('worm', 'assets/images/parasite.png');
        // 월드맵 타일 이미지 로드
        this.loader.loadImage('world-tile', 'assets/images/world-tile.png');
        this.loader.loadImage('sea-tile', 'assets/images/sea-tile.png');
        this.loader.loadImage('talisman1', 'assets/images/talisman-1.png');
        this.loader.loadImage('talisman2', 'assets/images/talisman-2.png');
        // 휘장 아이템 이미지 로드
        this.loader.loadEmblemImages();
        // 시각 효과 이미지 로드
        this.loader.loadVfxImages();

        this.loader.onReady(assets => this.init(assets));
    }

    init(assets) {
        this.assets = assets;
        // 설정에 따라 WebGL 레이어를 활성화한다
        this.layerManager = new LayerManager(SETTINGS.ENABLE_WEBGL_RENDERER);
        const canvas = this.layerManager.layers.mapBase;

        // === 1. 모든 매니저 및 시스템 생성 ===
        this.eventManager = new EventManager();
        this.tooltipManager = new TooltipManager();
        this.entityManager = new EntityManager(this.eventManager);
        // InputHandler를 생성할 때 game 객체(this)를 전달합니다.
        this.inputHandler = new InputHandler(this);
        this.combatLogManager = new CombatLogManager(this.eventManager);
        
        this.statusEffectsManager = new StatusEffectsManager(this.eventManager);
        this.tagManager = new TagManager();
        this.combatCalculator = new CombatCalculator(this.eventManager, this.tagManager);
        // Player begins in the Aquarium map for feature testing
        this.mapManager = new AquariumMapManager();
        // MovementEngine은 맵의 타일 크기를 기반으로 동작합니다.
        this.movementEngine = new MovementEngine({ tileSize: this.mapManager.tileSize });

        const mapPixelWidth = this.mapManager.width * this.mapManager.tileSize;
        const mapPixelHeight = this.mapManager.height * this.mapManager.tileSize;
        const laneCenters = this.mapManager.getLaneCenters ? this.mapManager.getLaneCenters() : null;
        this.laneManager = new LaneManager(mapPixelWidth, mapPixelHeight, laneCenters);
        this.laneRenderManager = new LaneRenderManager(this.laneManager, SETTINGS.ENABLE_AQUARIUM_LANES);
        const formationSpacing = this.mapManager.tileSize * 2.5;
        const formationAngle = -Math.PI / 4; // align grid with battlefield orientation
        this.formationManager = new FormationManager(5, 5, formationSpacing, 'LEFT', formationAngle);
        this.eventManager.subscribe('formation_assign_request', d => {
            if (d.squadId) {
                const squad = this.squadManager.getSquad(d.squadId);
                if (squad) {
                    squad.members.forEach(id => this.formationManager.assign(d.slotIndex, id));
                }
            } else {
                this.formationManager.assign(d.slotIndex, d.entityId);
            }
            this.uiManager?.createSquadManagementUI();
        });
        this.saveLoadManager = new SaveLoadManager();
        // TurnManager \uC124\uC815: \uBAA8\uB4E0 \uC0DD\uCCB4\uAC00 \uC5C6\uB294 \uCD08\uAE30
        // \uB370\uC774\uD130\uC640 movementEngine\uB9CC \uC804\uB2EC\uD569\uB2C8\uB2E4.
        this.turnManager = new TurnManager([], this.movementEngine);
        this.narrativeManager = new NarrativeManager();
        this.supportEngine = new SupportEngine();
        this.factory = new CharacterFactory(assets, this);
        this.inventoryManager = new InventoryManager({
            eventManager: this.eventManager,
            entityManager: this.entityManager,
        });
        // 월드맵 로직을 담당하는 엔진
        this.worldEngine = new WorldEngine(this, assets, this.movementEngine);
        this.combatEngine = new CombatEngine(this);

        // --- GridRenderer 인스턴스 생성 ---
        // AquariumMapManager의 정보를 바탕으로 GridRenderer를 초기화합니다.
        this.gridRenderer = new GridRenderer({
            mapWidth: this.mapManager.width * this.mapManager.tileSize,
            mapHeight: this.mapManager.height * this.mapManager.tileSize,
            tileSize: this.mapManager.tileSize,
            lineColor: '#000',
            lineWidth: 6
        });

        // --- 매니저 생성 부분 수정 ---
        this.managers = {};
        // ItemManager를 먼저 생성합니다.
        this.itemTracker = new ItemTracker();
        this.itemManager = new Managers.ItemManager(0, this.mapManager, assets, this.itemTracker);
        this.managers.ItemManager = this.itemManager;

        // VFXManager는 ItemManager와 EventManager가 모두 필요합니다.
        this.managers.VFXManager = new Managers.VFXManager(this.eventManager, this.itemManager);

        const otherManagerNames = Object.keys(Managers).filter(
            name =>
                name !== 'VFXManager' &&
                name !== 'ItemManager' &&
                name !== 'AuraManager' &&
                name !== 'ItemAIManager' &&
                name !== 'EffectManager' &&
                name !== 'SkillManager' &&
                name !== 'ProjectileManager' &&
                name !== 'SquadManager' &&
                name !== 'DataRecorder'
        );
        for (const managerName of otherManagerNames) {
            if (managerName === 'UIManager') {
                this.managers[managerName] = new Managers.UIManager(
                    this.eventManager,
                    (id) => this.entityManager?.getEntityById(id),
                    this.tooltipManager
                );
            } else {
                this.managers[managerName] = new Managers[managerName](this.eventManager, assets, this.factory);
            }
        }

        this.managers.EffectManager = new Managers.EffectManager(
            this.eventManager,
            this.managers.VFXManager
        );

        this.monsterManager = this.managers.MonsterManager;
        this.mercenaryManager = this.managers.MercenaryManager;
        this.itemManager = this.managers.ItemManager;
        this.equipmentManager = this.managers.EquipmentManager;
        this.uiManager = this.managers.UIManager;
        this.vfxManager = this.managers.VFXManager;
        this.vfxManager.game = this;
        this.soundManager = this.managers.SoundManager;
        this.bgmManager = this.managers.BgmManager;
        this.effectManager = this.managers.EffectManager;
        this.auraManager = new Managers.AuraManager(this.effectManager, this.eventManager, this.vfxManager);
        this.microItemAIManager = new Managers.MicroItemAIManager();
        this.microEngine = new MicroEngine(this.eventManager);
        this.microCombatManager = new MicroCombatManager(this.eventManager);
        this.synergyManager = new Managers.SynergyManager(this.eventManager);
        this.uiManager.setSynergyManager(this.synergyManager);
        this.speechBubbleManager = this.managers.SpeechBubbleManager;
        this.equipmentRenderManager = this.managers.EquipmentRenderManager;
        this.mercenaryManager.equipmentRenderManager = this.equipmentRenderManager;
        this.traitManager = this.managers.TraitManager;
        this.mercenaryManager.setTraitManager(this.traitManager);
        this.monsterManager.setTraitManager(this.traitManager);
        this.parasiteManager = this.managers.ParasiteManager;
        this.microWorld = new MicroWorldWorker();

        // 매니저 간 의존성 연결
        this.equipmentManager.setTagManager(this.tagManager);

        this.itemFactory = new ItemFactory(assets);
        // ItemManager handles loot drop events.
        this.itemManager.initEvents(this.eventManager, this.itemFactory, this.vfxManager, this.entityManager);
        // 게임 시작 시 무기 아이템들을 한 개씩 고용 인벤토리에 배치합니다.
        const weaponIds = Object.keys(ITEMS).filter(id => ITEMS[id].type === 'weapon');
        weaponIds.forEach(id => {
            const weapon = this.itemFactory.create(id, 0, 0, this.mapManager.tileSize);
            if (weapon) this.inventoryManager.getSharedInventory().push(weapon);
        });
        this.pathfindingManager = new PathfindingManager(this.mapManager);
        this.motionManager = new Managers.MotionManager(this.mapManager, this.pathfindingManager);
        this.knockbackEngine = new KnockbackEngine(this.motionManager, this.vfxManager);
        this.projectileManager = new Managers.ProjectileManager(
            this.eventManager,
            assets,
            this.vfxManager,
            this.knockbackEngine
        );
        this.managers.ProjectileManager = this.projectileManager;
        this.itemAIManager = new Managers.ItemAIManager(
            this.eventManager,
            this.projectileManager,
            this.vfxManager
        );
        this.itemAIManager.setEffectManager(this.effectManager);
        this.movementManager = new MovementManager(this.mapManager);
        this.fogManager = new FogManager(this.mapManager.width, this.mapManager.height);
        this.particleDecoratorManager = new Managers.ParticleDecoratorManager();
        this.particleDecoratorManager.setManagers(this.vfxManager, this.mapManager);
        this.particleDecoratorManager.init();
        this.effectIconManager = new Managers.EffectIconManager(this.eventManager, assets);
        // UIManager가 mercenaryManager에 접근할 수 있도록 설정
        this.uiManager.mercenaryManager = this.mercenaryManager;
        this.mercenaryManager.setUIManager(this.uiManager);
        this.uiManager.particleDecoratorManager = this.particleDecoratorManager;
        this.uiManager.vfxManager = this.vfxManager;
        this.uiManager.eventManager = this.eventManager;
        // UIManager가 Game 인스턴스에 접근할 수 있도록 참조를 전달
        this.uiManager.game = this;
        this.uiManager.getSharedInventory = () => this.inventoryManager.getSharedInventory();
        this.uiManager.formationManager = this.formationManager;
        this.squadManager = new Managers.SquadManager(this.eventManager, this.mercenaryManager);
        this.uiManager.squadManager = this.squadManager;
        this.uiManager.createSquadManagementUI?.();
        this.laneAssignmentManager = new LaneAssignmentManager({
            laneManager: this.laneManager,
            squadManager: this.squadManager,
            eventManager: this.eventManager
        });
        this.metaAIManager = new MetaAIManager(this.eventManager, this.squadManager);
        this.monsterManager.setMetaAIManager(this.metaAIManager);
        if (SETTINGS.ENABLE_REPUTATION_SYSTEM) {
            this.reputationManager = new ReputationManager(this.eventManager);
            this.reputationManager.mercenaryManager = this.mercenaryManager;
            this.reputationManager.mbtiEngine = this.metaAIManager.mbtiEngine;
            this.reputationManager.loadReputationModel();
        } else {
            this.reputationManager = null;
        }
        this.cinematicManager = new CinematicManager(this);
        this.dataRecorder = new DataRecorder(this);
        this.dataRecorder.init();
        this.guidelineLoader = new GuidelineLoader(SETTINGS.GUIDELINE_REPO_URL);
        this.guidelineLoader.load();
        if (SETTINGS.ENABLE_POSSESSION_SYSTEM) {
            this.possessionAIManager = new PossessionAIManager(this.eventManager);
        } else {
            this.possessionAIManager = null;
        }
        this.itemFactory.emblems = EMBLEMS;

        this.skillManager = new Managers.SkillManager(
            this.eventManager,
            this.vfxManager,
            this.projectileManager,
            this.motionManager,
            this.factory,
            this.metaAIManager,
            this.knockbackEngine,
            assets
        );
        this.managers.SkillManager = this.skillManager;

        const ghostAIs = {
            tanker: new TankerGhostAI(),
            ranged: new RangedGhostAI(),
            supporter: new SupporterGhostAI(),
            cc: new CCGhostAI()
        };
        if (this.possessionAIManager) {
            const ghostTypes = Object.keys(ghostAIs);
            const numGhosts = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numGhosts; i++) {
                const randomType = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
                this.possessionAIManager.addGhost(new Ghost(randomType, ghostAIs[randomType]));
            }
        }
        this.petManager = new Managers.PetManager(this.eventManager, this.factory, this.metaAIManager, this.auraManager, this.vfxManager);
        this.managers.PetManager = this.petManager;
        this.skillManager.setManagers(
            this.effectManager,
            this.factory,
            this.metaAIManager,
            this.monsterManager,
            this.mercenaryManager,
            this.gameState
        );
        this.aquariumManager = new AquariumManager(
            this.eventManager,
            this.monsterManager,
            this.itemManager,
            this.mapManager,
            this.factory,
            this.itemFactory,
            this.vfxManager,
            this.traitManager
        );
        this.aquariumInspector = new AquariumInspector(this.aquariumManager);

        for (let i = 0; i < 20; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const rand = Math.random();
                let itemName = 'potion';
                if (rand < 0.6) itemName = 'gold';
                else if (rand < 0.7) itemName = 'fox_charm';
                const item = this.itemFactory.create(itemName, pos.x, pos.y, this.mapManager.tileSize);
                if (item) this.itemManager.addItem(item);
            }
        }

        // === 그룹 생성 ===
        this.playerGroup = this.metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
        // 플레이어는 직접 조종하므로 AI를 비활성화하지만 용병은 계속 행동하게 둡니다.
        this.monsterGroup = this.metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

        // === 몬스터 부대 생성 ===
        const enemyFormationManager = new FormationManager(5, 5, formationSpacing, 'RIGHT', formationAngle);
        const enemyFormationOrigin = {
            x: (this.mapManager.width - 4) * this.mapManager.tileSize,
            y: (this.mapManager.height / 2) * this.mapManager.tileSize,
        };
        const monsterSquad = [];
        const monsterCount = 15;
        for (let i = 0; i < monsterCount; i++) {
            const monster = this.factory.create('monster', {
                x: 0,
                y: 0,
                tileSize: this.mapManager.tileSize,
                groupId: this.monsterGroup.id,
                image: assets.monster,
            });
            monster.equipmentRenderManager = this.equipmentRenderManager;

            const weaponIds = ['short_sword','long_bow','axe','mace','staff','spear','scythe','whip','dagger','estoc'];
            const wId = weaponIds[Math.floor(Math.random() * weaponIds.length)];
            const weapon = this.itemFactory.create(wId, 0, 0, this.mapManager.tileSize);
            if (weapon) this.equipmentManager.equip(monster, weapon, null);

            const armorParts = ['iron_helmet','iron_gauntlets','iron_boots','leather_armor'];
            armorParts.forEach(p => {
                const item = this.itemFactory.create(p, 0, 0, this.mapManager.tileSize);
                if (item) this.equipmentManager.equip(monster, item, null);
            });

            const consumable = this.itemFactory.create('potion', 0, 0, this.mapManager.tileSize);
            if (consumable) monster.consumables.push(consumable);

            this.monsterManager.addMonster(monster);
            monsterSquad.push(monster);
        }
        const monsterEntityMap = {};
        monsterSquad.forEach(m => { monsterEntityMap[m.id] = m; });
        monsterSquad.forEach((monster, idx) => {
            if (idx < 25) {
                enemyFormationManager.assign(idx, monster.id);
            }
        });
        enemyFormationManager.apply(enemyFormationOrigin, monsterEntityMap);

        // === 2. 플레이어 생성 ===
        let startPos;
        startPos = { x: this.mapManager.tileSize * 4, y: (this.mapManager.height * this.mapManager.tileSize) / 2 };
        const player = this.factory.create('player', {
            x: startPos.x,
            y: startPos.y,
            tileSize: this.mapManager.tileSize,
            groupId: this.playerGroup.id,
            image: assets.player,
            // 초반 난이도를 맞추기 위해 이동 속도를 낮춘다
            baseStats: { strength: 5, agility: 5, endurance: 15, movement: 4 }
        });
        player.ai = null; // disable any automatic skills for the player
        player.equipmentRenderManager = this.equipmentRenderManager;

        // 초기 장비 세팅
        const pHelmet = this.itemFactory.create('iron_helmet', 0, 0, this.mapManager.tileSize);
        const pGloves = this.itemFactory.create('iron_gauntlets', 0, 0, this.mapManager.tileSize);
        const pBoots = this.itemFactory.create('iron_boots', 0, 0, this.mapManager.tileSize);
        const pArmor = this.itemFactory.create('leather_armor', 0, 0, this.mapManager.tileSize);
        if (pHelmet) this.equipmentManager.equip(player, pHelmet, null);
        if (pGloves) this.equipmentManager.equip(player, pGloves, null);
        if (pBoots) this.equipmentManager.equip(player, pBoots, null);
        if (pArmor) this.equipmentManager.equip(player, pArmor, null);
        this.gameState = {
            currentState: 'WORLD',
            player,
            inventory: this.inventoryManager.getSharedInventory(),
            gold: 1000,
            statPoints: 5,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: SETTINGS.DEFAULT_ZOOM,
            isPaused: false
        };
        this.cameraDrag = {
            isDragging: false,
            dragStart: { x: 0, y: 0 },
            cameraStart: { x: 0, y: 0 },
            followPlayer: true
        };
        this.playerGroup.addMember(player);
        // Game 인스턴스에서 직접 플레이어에 접근할 수 있도록 참조를 저장합니다.
        this.player = player;
        // 월드 엔진에서도 동일한 플레이어 데이터를 사용하도록 설정
        this.worldEngine.setPlayer(player);

        // 초기 아이템 배치
        if (this.mapManager.name !== 'aquarium') {
            const potion = this.itemFactory.create(
                                    'potion',
                                    player.x + this.mapManager.tileSize,
                                    player.y,
                                    this.mapManager.tileSize);
            const dagger = this.itemFactory.create('short_sword',
                                    player.x - this.mapManager.tileSize,
                                    player.y,
                                    this.mapManager.tileSize);
            const bow = this.itemFactory.create('long_bow',
                                    player.x,
                                    player.y + this.mapManager.tileSize,
                                    this.mapManager.tileSize);
            const violinBow = this.itemFactory.create('violin_bow',
                                    player.x + this.mapManager.tileSize,
                                    player.y - this.mapManager.tileSize,
                                    this.mapManager.tileSize);
            const plateArmor = this.itemFactory.create('plate_armor',
                                    player.x + this.mapManager.tileSize * 2,
                                    player.y - this.mapManager.tileSize,
                                    this.mapManager.tileSize);
            const foxEgg = this.itemFactory.create('pet_fox',
                                    player.x - this.mapManager.tileSize * 2,
                                    player.y,
                                    this.mapManager.tileSize);
            const foxCharm = this.itemFactory.create('fox_charm',
                                    player.x,
                                    player.y - this.mapManager.tileSize * 2,
                                    this.mapManager.tileSize);
            // --- 테스트용 휘장 아이템 4종 배치 ---
            const emblemGuardian = this.itemFactory.create('emblem_guardian', player.x + 64, player.y + 64, this.mapManager.tileSize);
            const emblemDestroyer = this.itemFactory.create('emblem_destroyer', player.x - 64, player.y + 64, this.mapManager.tileSize);
            const emblemDevotion = this.itemFactory.create('emblem_devotion', player.x + 64, player.y - 64, this.mapManager.tileSize);
            const emblemConductor = this.itemFactory.create('emblem_conductor', player.x - 64, player.y - 64, this.mapManager.tileSize);
            this.itemManager.addItem(potion);
            if (dagger) this.itemManager.addItem(dagger);
            if (bow) this.itemManager.addItem(bow);
            if (violinBow) this.itemManager.addItem(violinBow);
            if (plateArmor) this.itemManager.addItem(plateArmor);
            if (foxEgg) this.itemManager.addItem(foxEgg);
            if (foxCharm) this.itemManager.addItem(foxCharm);
            if(emblemGuardian) this.itemManager.addItem(emblemGuardian);
            if(emblemDestroyer) this.itemManager.addItem(emblemDestroyer);
            if(emblemDevotion) this.itemManager.addItem(emblemDevotion);
            if(emblemConductor) this.itemManager.addItem(emblemConductor);
        }

        // === 3. 몬스터 생성 ===
        // 기존 무작위 스폰 로직을 제거하고 formationManager를 통해 일괄 배치합니다.

        if (SETTINGS.ENABLE_AQUARIUM_LANES) {
            // --- 3-Lane 모드 설정 로직 ---
            const friendlySquads = this.squadManager.getSquads();
            const lanes = ['TOP', 'MID', 'BOTTOM'];
            Object.values(friendlySquads).forEach((squad, index) => {
                const lane = lanes[index];
                if (!lane) return;
                squad.name = lane;
                squad.members.forEach(mercId => {
                    const merc = this.entityManager.getEntityById(mercId);
                    if (merc) {
                        merc.team = 'LEFT';
                        merc.lane = lane;
                        merc.ai = new LanePusherAI();
                        merc.currentWaypointIndex = 0;
                    }
                });
            });

            const allMonsters = this.monsterManager.getMonsters();
            const monstersPerLane = Math.floor(allMonsters.length / 3);
            allMonsters.forEach((monster, idx) => {
                let lane = 'MID';
                if (idx < monstersPerLane) lane = 'TOP';
                else if (idx < monstersPerLane * 2) lane = 'BOTTOM';

                monster.team = 'RIGHT';
                monster.lane = lane;
                monster.ai = new LanePusherAI();
                monster.currentWaypointIndex = 0;
                const startWaypoint = this.laneManager.getNextWaypoint(monster);
                if (startWaypoint) {
                    monster.x = startWaypoint.x;
                    monster.y = startWaypoint.y;
                }
            });
        }

        this.entityManager.init(this.gameState.player, this.mercenaryManager.mercenaries, this.monsterManager.monsters);
        // Apply initial formation for player party
        const origin = { x: this.gameState.player.x, y: this.gameState.player.y };
        const entityMap = { [player.id]: this.gameState.player };
        this.mercenaryManager.mercenaries.forEach(m => { entityMap[m.id] = m; });
        this.formationManager.assign(12, player.id);
        this.mercenaryManager.mercenaries.forEach((m, idx) => {
            const slotIndex = [6, 7, 8, 11, 13][idx] || idx;
            this.formationManager.assign(slotIndex, m.id);
        });
        this.formationManager.apply(origin, entityMap);
        this.equipmentManager.entityManager = this.entityManager;
        this.aspirationManager = new AspirationManager(this.eventManager, this.microWorld, this.effectManager, this.vfxManager, this.entityManager);

        // === 4. 용병 고용 로직 ===
        const hireBtn = document.getElementById('hire-mercenary');
        if (hireBtn) {
            hireBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'warrior',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const archerBtn = document.getElementById('hire-archer');
        if (archerBtn) {
            archerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'archer',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const healerBtn = document.getElementById('hire-healer');
        if (healerBtn) {
            healerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'healer',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const wizardBtn = document.getElementById('hire-wizard');
        if (wizardBtn) {
            wizardBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'wizard',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const bardBtn = document.getElementById('hire-bard');
        if (bardBtn) {
            bardBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'bard',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const summonerBtn = document.getElementById('hire-summoner');
        if (summonerBtn) {
            summonerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'summoner',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const fireGodBtn = document.getElementById('hire-fire-god');
        if (fireGodBtn) {
            fireGodBtn.onclick = () => {
                if (this.gameState.gold >= 100) {
                    this.gameState.gold -= 100;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'fire_god',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const saveBtn = document.getElementById('save-game-btn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const saveData = this.saveLoadManager.gatherSaveData(this.gameState, this.monsterManager, this.mercenaryManager);
                console.log("--- GAME STATE SAVED (SNAPSHOT) ---");
                console.log(saveData);
                this.eventManager.publish('log', { message: '게임 상태 스냅샷이 콘솔에 저장되었습니다.' });
            };
        }

        const autoBtn = document.getElementById('toggle-autobattle-btn');
        if (autoBtn) {
            autoBtn.onclick = () => {
                const player = this.gameState.player;
                player.autoBattle = !player.autoBattle;
                if (typeof player.updateAI === 'function') player.updateAI();
                autoBtn.textContent = `자동 전투: ${player.autoBattle ? 'ON' : 'OFF'}`;
            };
        }

        // === 메뉴 버튼 이벤트 리스너 수정 ===
        const playerInfoBtn = document.querySelector('.menu-btn[data-panel-id="character-sheet-panel"]');
        if (playerInfoBtn) {
            playerInfoBtn.onclick = () => {
                this.uiManager.displayCharacterSheet(this.gameState.player);
                this.gameState.isPaused = true;
            };
        }
        document.querySelectorAll('.menu-btn').forEach(button => {
            if (button.dataset.panelId !== 'character-sheet-panel') {
                button.onclick = () => {
                    const panelId = button.dataset.panelId;
                    this.uiManager.showPanel(panelId);
                    this.gameState.isPaused = true;
                };
            }
        });

        this.setupEventListeners(assets, canvas);

        this.gameLoop = new GameLoop(this.update, this.render);
        this.gameLoop.start();
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
}
