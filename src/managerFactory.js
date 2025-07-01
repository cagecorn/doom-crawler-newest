export class ManagerFactory {
    static initialize(game, assets) {
                game.assets = assets;
        // 설정에 따라 WebGL 레이어를 활성화한다
        game.layerManager = new LayerManager(SETTINGS.ENABLE_WEBGL_RENDERER);
        const canvas = game.layerManager.layers.mapBase;

        // === 1. 모든 매니저 및 시스템 생성 ===
        game.eventManager = new EventManager();
        game.tooltipManager = new TooltipManager();
        game.entityManager = new EntityManager(game.eventManager);
        game.groupManager = new GroupManager(game.eventManager, game.entityManager.getEntityById.bind(game.entityManager));
        // CommanderManager 초기화
        game.commanderManager = new CommanderManager(game.groupManager);
        // 전투 후 결과 처리를 담당하는 매니저
        game.battleResultManager = new BattleResultManager(
            game,
            game.eventManager,
            game.groupManager,
            game.entityManager
        );
        // InputHandler를 생성할 때 game 객체(this)를 전달합니다.
        game.inputHandler = new InputHandler(this);
        game.combatLogManager = new CombatLogManager(game.eventManager);
        
        game.statusEffectsManager = new StatusEffectsManager(game.eventManager);
        game.tagManager = new TagManager();
        game.combatCalculator = new CombatCalculator(game.eventManager, game.tagManager);
        // Player begins in the Aquarium map for feature testing
        game.mapManager = new AquariumMapManager();
        // MovementEngine은 맵의 타일 크기를 기반으로 동작합니다.
        game.movementEngine = new MovementEngine({ tileSize: game.mapManager.tileSize });

        const mapPixelWidth = game.mapManager.width * game.mapManager.tileSize;
        const mapPixelHeight = game.mapManager.height * game.mapManager.tileSize;
        const laneCenters = game.mapManager.getLaneCenters ? game.mapManager.getLaneCenters() : null;
        game.laneManager = new LaneManager(mapPixelWidth, mapPixelHeight, laneCenters);
        game.laneRenderManager = new LaneRenderManager(game.laneManager, SETTINGS.ENABLE_AQUARIUM_LANES);
        const formationSpacing = game.mapManager.tileSize * 2.5;
        const formationAngle = -Math.PI / 4; // align grid with battlefield orientation
        game.formationManager = new FormationManager(5, 5, formationSpacing, 'LEFT', formationAngle);
        game.eventManager.subscribe('formation_assign_request', d => {
            if (d.squadId) {
                const squad = game.squadManager.getSquad(d.squadId);
                if (squad) {
                    squad.members.forEach(id => game.formationManager.assign(d.slotIndex, id));
                }
            } else {
                game.formationManager.assign(d.slotIndex, d.entityId);
            }
            game.uiManager?.createSquadManagementUI();
        });
        game.saveLoadManager = new SaveLoadManager();
        // TurnManager \uC124\uC815: \uBAA8\uB4E0 \uC0DD\uCCB4\uAC00 \uC5C6\uB294 \uCD08\uAE30
        // \uB370\uC774\uD130\uC640 movementEngine\uB9CC \uC804\uB2EC\uD569\uB2C8\uB2E4.
        game.turnManager = new TurnManager([], game.movementEngine);
        game.narrativeManager = new NarrativeManager();
        game.supportEngine = new SupportEngine();
        game.factory = new CharacterFactory(assets, this);
        game.inventoryManager = new InventoryManager({
            eventManager: game.eventManager,
            entityManager: game.entityManager,
        });
        // 월드맵 로직을 담당하는 엔진
        game.worldMapRenderManager = new WorldmapRenderManager(game.groupManager);
        game.worldEngine = new WorldEngine(game, assets, game.movementEngine, game.worldMapRenderManager);
        game.combatEngine = new CombatEngine(this);
        game.battleManager = new BattleManager(game, game.eventManager, game.groupManager, game.entityManager, game.factory);
        // 전투 준비 과정에서 충돌한 몬스터 파티 정보를 임시로 저장
        game.pendingMonsterParty = null;

        // --- GridRenderer 인스턴스 생성 ---
        // AquariumMapManager의 정보를 바탕으로 GridRenderer를 초기화합니다.
        game.gridRenderer = new GridRenderer({
            mapWidth: game.mapManager.width * game.mapManager.tileSize,
            mapHeight: game.mapManager.height * game.mapManager.tileSize,
            tileSize: game.mapManager.tileSize,
            lineColor: '#000',
            lineWidth: 6
        });

        // --- 매니저 생성 부분 수정 ---
        game.managers = {};
        // ItemManager를 먼저 생성합니다.
        game.itemTracker = new ItemTracker();
        game.itemManager = new Managers.ItemManager(0, game.mapManager, assets, game.itemTracker);
        game.managers.ItemManager = game.itemManager;

        // VFXManager는 ItemManager와 EventManager가 모두 필요합니다.
        game.managers.VFXManager = new Managers.VFXManager(game.eventManager, game.itemManager);

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
                game.managers[managerName] = new Managers.UIManager(
                    game.eventManager,
                    (id) => game.entityManager?.getEntityById(id),
                    game.tooltipManager,
                    game.commanderManager,
                    game.entityManager
                );
            } else {
                game.managers[managerName] = new Managers[managerName](game.eventManager, assets, game.factory);
            }
        }

        game.managers.EffectManager = new Managers.EffectManager(
            game.eventManager,
            game.managers.VFXManager
        );

        game.monsterManager = game.managers.MonsterManager;
        game.mercenaryManager = game.managers.MercenaryManager;
        game.itemManager = game.managers.ItemManager;
        game.equipmentManager = game.managers.EquipmentManager;
        game.uiManager = game.managers.UIManager;
        game.vfxManager = game.managers.VFXManager;
        game.vfxManager.game = this;
        game.soundManager = game.managers.SoundManager;
        game.bgmManager = game.managers.BgmManager;
        game.effectManager = game.managers.EffectManager;
        game.auraManager = new Managers.AuraManager(game.effectManager, game.eventManager, game.vfxManager);
        game.microItemAIManager = new Managers.MicroItemAIManager();
        game.microEngine = new MicroEngine(game.eventManager);
        game.microCombatManager = new MicroCombatManager(game.eventManager);
        game.synergyManager = new Managers.SynergyManager(game.eventManager);
        game.uiManager.setSynergyManager(game.synergyManager);
        game.speechBubbleManager = game.managers.SpeechBubbleManager;
        game.equipmentRenderManager = game.managers.EquipmentRenderManager;
        game.mercenaryManager.equipmentRenderManager = game.equipmentRenderManager;
        game.traitManager = game.managers.TraitManager;
        game.mercenaryManager.setTraitManager(game.traitManager);
        game.monsterManager.setTraitManager(game.traitManager);
        game.parasiteManager = game.managers.ParasiteManager;
        game.microWorld = new MicroWorldWorker();

        // 매니저 간 의존성 연결
        game.equipmentManager.setTagManager(game.tagManager);

        game.itemFactory = new ItemFactory(assets);
        // ItemManager handles loot drop events.
        game.itemManager.initEvents(game.eventManager, game.itemFactory, game.vfxManager, game.entityManager);
        // 게임 시작 시 무기 아이템들을 한 개씩 고용 인벤토리에 배치합니다.
        const weaponIds = Object.keys(ITEMS).filter(id => ITEMS[id].type === 'weapon');
        weaponIds.forEach(id => {
            const weapon = game.itemFactory.create(id, 0, 0, game.mapManager.tileSize);
            if (weapon) game.inventoryManager.getSharedInventory().push(weapon);
        });
        game.pathfindingManager = new PathfindingManager(game.mapManager);
        game.motionManager = new Managers.MotionManager(game.mapManager, game.pathfindingManager);
        game.knockbackEngine = new KnockbackEngine(game.motionManager, game.vfxManager);
        game.projectileManager = new Managers.ProjectileManager(
            game.eventManager,
            assets,
            game.vfxManager,
            game.knockbackEngine
        );
        game.managers.ProjectileManager = game.projectileManager;
        game.itemAIManager = new Managers.ItemAIManager(
            game.eventManager,
            game.projectileManager,
            game.vfxManager
        );
        game.itemAIManager.setEffectManager(game.effectManager);
        game.movementManager = new MovementManager(game.mapManager);
        game.worldMapAIManager = new WorldMapAIManager(
            game.entityManager,
            game.movementManager,
            game.eventManager
        );
        game.fogManager = new FogManager(game.mapManager.width, game.mapManager.height);
        game.particleDecoratorManager = new Managers.ParticleDecoratorManager();
        game.particleDecoratorManager.setManagers(game.vfxManager, game.mapManager);
        game.particleDecoratorManager.init();
        game.effectIconManager = new Managers.EffectIconManager(game.eventManager, assets);
        // UIManager가 mercenaryManager에 접근할 수 있도록 설정
        game.uiManager.mercenaryManager = game.mercenaryManager;
        game.mercenaryManager.setUIManager(game.uiManager);
        game.uiManager.particleDecoratorManager = game.particleDecoratorManager;
        game.uiManager.vfxManager = game.vfxManager;
        game.uiManager.eventManager = game.eventManager;
        // UIManager가 Game 인스턴스에 접근할 수 있도록 참조를 전달
        game.uiManager.game = this;
        game.uiManager.getSharedInventory = () => game.inventoryManager.getSharedInventory();
        game.uiManager.formationManager = game.formationManager;
        game.squadManager = new Managers.SquadManager(game.eventManager, game.mercenaryManager);
        game.uiManager.squadManager = game.squadManager;
        game.uiManager.createSquadManagementUI?.();
        game.laneAssignmentManager = new LaneAssignmentManager({
            laneManager: game.laneManager,
            squadManager: game.squadManager,
            eventManager: game.eventManager
        });
        game.metaAIManager = new MetaAIManager(game.eventManager, game.squadManager);
        game.monsterManager.setMetaAIManager(game.metaAIManager);
        if (SETTINGS.ENABLE_REPUTATION_SYSTEM) {
            game.reputationManager = new ReputationManager(game.eventManager);
            game.reputationManager.mercenaryManager = game.mercenaryManager;
            game.reputationManager.mbtiEngine = game.metaAIManager.mbtiEngine;
            game.reputationManager.loadReputationModel();
        } else {
            game.reputationManager = null;
        }
        game.cinematicManager = new CinematicManager(this);
        game.dataRecorder = new DataRecorder(this);
        game.dataRecorder.init();
        game.guidelineLoader = new GuidelineLoader(SETTINGS.GUIDELINE_REPO_URL);
        game.guidelineLoader.load();
        if (SETTINGS.ENABLE_POSSESSION_SYSTEM) {
            game.possessionAIManager = new PossessionAIManager(game.eventManager);
        } else {
            game.possessionAIManager = null;
        }
        game.itemFactory.emblems = EMBLEMS;

        game.skillManager = new Managers.SkillManager(
            game.eventManager,
            game.vfxManager,
            game.projectileManager,
            game.motionManager,
            game.factory,
            game.metaAIManager,
            game.knockbackEngine,
            assets
        );
        game.managers.SkillManager = game.skillManager;

        const ghostAIs = {
            tanker: new TankerGhostAI(),
            ranged: new RangedGhostAI(),
            supporter: new SupporterGhostAI(),
            cc: new CCGhostAI()
        };
        if (game.possessionAIManager) {
            const ghostTypes = Object.keys(ghostAIs);
            const numGhosts = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numGhosts; i++) {
                const randomType = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
                game.possessionAIManager.addGhost(new Ghost(randomType, ghostAIs[randomType]));
            }
        }
        game.petManager = new Managers.PetManager(game.eventManager, game.factory, game.metaAIManager, game.auraManager, game.vfxManager);
        game.managers.PetManager = game.petManager;
        game.skillManager.setManagers(
            game.effectManager,
            game.factory,
            game.metaAIManager,
            game.monsterManager,
            game.mercenaryManager,
            game.gameState
        );
        game.aquariumManager = new AquariumManager(
            game.eventManager,
            game.monsterManager,
            game.itemManager,
            game.mapManager,
            game.factory,
            game.itemFactory,
            game.vfxManager,
            game.traitManager
        );
        game.aquariumInspector = new AquariumInspector(game.aquariumManager);

        for (let i = 0; i < 20; i++) {
            const pos = game.mapManager.getRandomFloorPosition();
            if (pos) {
                const rand = Math.random();
                let itemName = 'potion';
                if (rand < 0.6) itemName = 'gold';
                else if (rand < 0.7) itemName = 'fox_charm';
                const item = game.itemFactory.create(itemName, pos.x, pos.y, game.mapManager.tileSize);
                if (item) game.itemManager.addItem(item);
            }
        }

        // === 그룹 생성 ===
        game.playerGroup = game.metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
        // 플레이어는 직접 조종하므로 AI를 비활성화하지만 용병은 계속 행동하게 둡니다.
        game.monsterGroup = game.metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

        // === 몬스터 부대 생성 ===
        const enemyFormationManager = new FormationManager(5, 5, formationSpacing, 'RIGHT', formationAngle);
        const enemyFormationOrigin = {
            x: (game.mapManager.width - 4) * game.mapManager.tileSize,
            y: (game.mapManager.height / 2) * game.mapManager.tileSize,
        };
        const monsterSquad = [];
        const monsterCount = 15;
        for (let i = 0; i < monsterCount; i++) {
            const monster = game.factory.create('monster', {
                x: 0,
                y: 0,
                tileSize: game.mapManager.tileSize,
                groupId: game.monsterGroup.id,
                image: assets.monster,
            });
            monster.equipmentRenderManager = game.equipmentRenderManager;

            const weaponIds = ['short_sword','long_bow','axe','mace','staff','spear','scythe','whip','dagger','estoc'];
            const wId = weaponIds[Math.floor(Math.random() * weaponIds.length)];
            const weapon = game.itemFactory.create(wId, 0, 0, game.mapManager.tileSize);
            if (weapon) game.equipmentManager.equip(monster, weapon, null);

            const armorParts = ['iron_helmet','iron_gauntlets','iron_boots','leather_armor'];
            armorParts.forEach(p => {
                const item = game.itemFactory.create(p, 0, 0, game.mapManager.tileSize);
                if (item) game.equipmentManager.equip(monster, item, null);
            });

            const consumable = game.itemFactory.create('potion', 0, 0, game.mapManager.tileSize);
            if (consumable) monster.consumables.push(consumable);

            game.monsterManager.addMonster(monster);
            game.groupManager.addMember(monster);
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

        // 월드맵에 첫 번째 몬스터를 지휘관으로 배치
        if (game.worldEngine && monsterSquad[0]) {
            game.worldEngine.addMonster(monsterSquad[0], 3, 2);
        }

        // === 2. 플레이어 생성 ===
        let startPos;
        startPos = { x: game.mapManager.tileSize * 4, y: (game.mapManager.height * game.mapManager.tileSize) / 2 };
        const player = game.factory.create('player', {
            x: startPos.x,
            y: startPos.y,
            tileSize: game.mapManager.tileSize,
            groupId: game.playerGroup.id,
            image: assets.player,
            // 초반 난이도를 맞추기 위해 이동 속도를 낮춘다
            baseStats: { strength: 5, agility: 5, endurance: 15, movement: 4 }
        });
        player.ai = null; // disable any automatic skills for the player
        player.equipmentRenderManager = game.equipmentRenderManager;

        // 초기 장비 세팅
        const pHelmet = game.itemFactory.create('iron_helmet', 0, 0, game.mapManager.tileSize);
        const pGloves = game.itemFactory.create('iron_gauntlets', 0, 0, game.mapManager.tileSize);
        const pBoots = game.itemFactory.create('iron_boots', 0, 0, game.mapManager.tileSize);
        const pArmor = game.itemFactory.create('leather_armor', 0, 0, game.mapManager.tileSize);
        if (pHelmet) game.equipmentManager.equip(player, pHelmet, null);
        if (pGloves) game.equipmentManager.equip(player, pGloves, null);
        if (pBoots) game.equipmentManager.equip(player, pBoots, null);
        if (pArmor) game.equipmentManager.equip(player, pArmor, null);
        game.gameState = {
            currentState: 'WORLD',
            player,
            inventory: game.inventoryManager.getSharedInventory(),
            gold: 1000,
            statPoints: 5,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: SETTINGS.DEFAULT_ZOOM,
            isPaused: false
        };
        game.cameraDrag = {
            isDragging: false,
            dragStart: { x: 0, y: 0 },
            cameraStart: { x: 0, y: 0 },
            followPlayer: true
        };
        game.playerGroup.addMember(player);
        game.groupManager.addMember(player);
        // Game 인스턴스에서 직접 플레이어에 접근할 수 있도록 참조를 저장합니다.
        game.player = player;
        // 월드 엔진에서도 동일한 플레이어 데이터를 사용하도록 설정
        game.worldEngine.setPlayer(player);

        // 초기 아이템 배치
        if (game.mapManager.name !== 'aquarium') {
            const potion = game.itemFactory.create(
                                    'potion',
                                    player.x + game.mapManager.tileSize,
                                    player.y,
                                    game.mapManager.tileSize);
            const dagger = game.itemFactory.create('short_sword',
                                    player.x - game.mapManager.tileSize,
                                    player.y,
                                    game.mapManager.tileSize);
            const bow = game.itemFactory.create('long_bow',
                                    player.x,
                                    player.y + game.mapManager.tileSize,
                                    game.mapManager.tileSize);
            const violinBow = game.itemFactory.create('violin_bow',
                                    player.x + game.mapManager.tileSize,
                                    player.y - game.mapManager.tileSize,
                                    game.mapManager.tileSize);
            const plateArmor = game.itemFactory.create('plate_armor',
                                    player.x + game.mapManager.tileSize * 2,
                                    player.y - game.mapManager.tileSize,
                                    game.mapManager.tileSize);
            const foxEgg = game.itemFactory.create('pet_fox',
                                    player.x - game.mapManager.tileSize * 2,
                                    player.y,
                                    game.mapManager.tileSize);
            const foxCharm = game.itemFactory.create('fox_charm',
                                    player.x,
                                    player.y - game.mapManager.tileSize * 2,
                                    game.mapManager.tileSize);
            // --- 테스트용 휘장 아이템 4종 배치 ---
            const emblemGuardian = game.itemFactory.create('emblem_guardian', player.x + 64, player.y + 64, game.mapManager.tileSize);
            const emblemDestroyer = game.itemFactory.create('emblem_destroyer', player.x - 64, player.y + 64, game.mapManager.tileSize);
            const emblemDevotion = game.itemFactory.create('emblem_devotion', player.x + 64, player.y - 64, game.mapManager.tileSize);
            const emblemConductor = game.itemFactory.create('emblem_conductor', player.x - 64, player.y - 64, game.mapManager.tileSize);
            game.itemManager.addItem(potion);
            if (dagger) game.itemManager.addItem(dagger);
            if (bow) game.itemManager.addItem(bow);
            if (violinBow) game.itemManager.addItem(violinBow);
            if (plateArmor) game.itemManager.addItem(plateArmor);
            if (foxEgg) game.itemManager.addItem(foxEgg);
            if (foxCharm) game.itemManager.addItem(foxCharm);
            if(emblemGuardian) game.itemManager.addItem(emblemGuardian);
            if(emblemDestroyer) game.itemManager.addItem(emblemDestroyer);
            if(emblemDevotion) game.itemManager.addItem(emblemDevotion);
            if(emblemConductor) game.itemManager.addItem(emblemConductor);
        }

        // === 3. 몬스터 생성 ===
        // 기존 무작위 스폰 로직을 제거하고 formationManager를 통해 일괄 배치합니다.

        if (SETTINGS.ENABLE_AQUARIUM_LANES) {
            // --- 3-Lane 모드 설정 로직 ---
            const friendlySquads = game.squadManager.getSquads();
            const lanes = ['TOP', 'MID', 'BOTTOM'];
            Object.values(friendlySquads).forEach((squad, index) => {
                const lane = lanes[index];
                if (!lane) return;
                squad.name = lane;
                squad.members.forEach(mercId => {
                    const merc = game.entityManager.getEntityById(mercId);
                    if (merc) {
                        merc.team = 'LEFT';
                        merc.lane = lane;
                        merc.ai = new LanePusherAI();
                        merc.currentWaypointIndex = 0;
                    }
                });
            });

            const allMonsters = game.monsterManager.getMonsters();
            const monstersPerLane = Math.floor(allMonsters.length / 3);
            allMonsters.forEach((monster, idx) => {
                let lane = 'MID';
                if (idx < monstersPerLane) lane = 'TOP';
                else if (idx < monstersPerLane * 2) lane = 'BOTTOM';

                monster.team = 'RIGHT';
                monster.lane = lane;
                monster.ai = new LanePusherAI();
                monster.currentWaypointIndex = 0;
                const startWaypoint = game.laneManager.getNextWaypoint(monster);
                if (startWaypoint) {
                    monster.x = startWaypoint.x;
                    monster.y = startWaypoint.y;
                }
            });
        }

        game.entityManager.init(game.gameState.player, game.mercenaryManager.mercenaries, game.monsterManager.monsters);
        // Apply initial formation for player party
        const origin = { x: game.gameState.player.x, y: game.gameState.player.y };
        const entityMap = { [player.id]: game.gameState.player };
        game.mercenaryManager.mercenaries.forEach(m => { entityMap[m.id] = m; });
        game.formationManager.assign(12, player.id);
        game.mercenaryManager.mercenaries.forEach((m, idx) => {
            const slotIndex = [6, 7, 8, 11, 13][idx] || idx;
            game.formationManager.assign(slotIndex, m.id);
        });
        game.formationManager.apply(origin, entityMap);
        game.equipmentManager.entityManager = game.entityManager;
        game.aspirationManager = new AspirationManager(game.eventManager, game.microWorld, game.effectManager, game.vfxManager, game.entityManager);

    }
}
