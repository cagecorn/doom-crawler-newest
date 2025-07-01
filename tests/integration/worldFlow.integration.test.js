import { describe, test, assert } from '../helpers.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { WorldEngine } from '../../src/worldEngine.js';
import { MovementEngine } from '../../src/engines/movementEngine.js';
import { BattleResultManager } from '../../src/managers/battleResultManager.js';
import { MicroEngine } from '../../src/micro/MicroEngine.js';
import { GroupManager } from '../../src/managers/groupManager.js';
import { EntityManager } from '../../src/managers/entityManager.js';

// 통합 시나리오: 월드맵 -> 적군 접근 -> 충돌로 전투 시작 -> 타이머 종료 -> 결과 반영

describe('World-Battle Flow Integration', () => {
  test('enemy approaches, battle occurs and results reflect on world map', () => {
    const eventManager = new EventManager();

    const entityManager = new EntityManager(eventManager);
    const groupManager = new GroupManager(eventManager, id => entityManager.getEntityById(id));

    // 간단한 게임 스텁
    const game = {
      eventManager,
      mapManager: { tileSize: 1 },
      layerManager: { layers: { entity: { width: 10, height: 10 } } },
      inputHandler: { keysPressed: {} },
      gameState: { zoomLevel: 1 },
      showWorldMapCalled: false,
      showWorldMap() { this.showWorldMapCalled = true; },
      battleManager: { cleanupBattle() {} },
    };

    // 월드 엔진 초기화
    const assets = { 'world-tile': {}, 'sea-tile': {}, player: {}, monster: {} };
    const movementEngine = new MovementEngine({ tileSize: 1 });
    const world = new WorldEngine(game, assets, movementEngine, { renderMap(){}, renderEntities(){} });

    // 지휘관 및 부대 설정
    const playerCommander = { id: 'player', groupId: 'player', x: 2, y: 2, tileX: 2, tileY: 2, width:1, height:1 };
    const enemyCommander = { id: 'enemy', groupId: 'enemy', x: 4, y: 2, tileX: 4, tileY: 2, width:1, height:1 };

    entityManager.init(playerCommander, [], [enemyCommander]);
    groupManager.addMember(playerCommander);
    groupManager.addMember(enemyCommander);

    world.setPlayer(playerCommander);
    world.monsters = [enemyCommander];
    world.turnManager.entities = [playerCommander, enemyCommander];

    // 전투 결과 매니저
    const battleResultManager = new BattleResultManager(game, eventManager, groupManager, entityManager);

    // 전투 로직 스텁
    const microEngine = new MicroEngine(eventManager);
    microEngine.playerUnits = [playerCommander];
    microEngine.enemyUnits = [enemyCommander];
    microEngine.isRunning = true; // 수동으로 실행 상태 설정

    let startCombat = false;

    eventManager.subscribe('start_combat', () => {
      startCombat = true;
      eventManager.publish('combat_started', { attacker: playerCommander, defender: enemyCommander });
      microEngine.timerManager.start();
      microEngine.update(31); // 타이머 만료로 전투 종료
    });

    // --- 적의 턴: 플레이어에게 두 칸 다가옴 ---
    world.turnManager.currentTurn = 'ENEMY';
    world.update(1);
    assert.strictEqual(enemyCommander.tileX, 2);

    // --- 플레이어 턴: 이동하여 충돌 유발 ---
    game.inputHandler.keysPressed['ArrowRight'] = true;
    world.update(1);
    game.inputHandler.keysPressed = {};

    assert.ok(startCombat, '충돌 시 start_combat 이벤트가 발생해야 합니다.');
    assert.ok(game.showWorldMapCalled, '전투 결과가 처리되면 월드맵으로 복귀해야 합니다.');
  });
});
