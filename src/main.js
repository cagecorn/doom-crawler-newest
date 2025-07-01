// 게임 시작 시 사용할 기본 맵 매니저로 전장 맵을 불러옵니다.
import { BattlefieldMapManager } from './battlefieldMap.js';
import { Commander } from './commander.js';
import { Entity } from './entities.js';

// 데모용 간단한 월드 객체
export const world = {
    // 기본 월드 맵을 전장 타입으로 설정합니다.
    map: new BattlefieldMapManager(),
    entities: [],
    addEntity(e) { this.entities.push(e); }
};

// Commander를 활용한 적 생성 예시
const enemy1 = new Commander({ x: 15, y: 15, tileSize: 1, stats: { name: '적 지휘관 1' } });
const enemy2 = new Commander({ x: 25, y: 25, tileSize: 1, stats: { name: '적 지휘관 2' } });
world.addEntity(enemy1);
world.addEntity(enemy2);

export function startBattle(player, enemy) {
    console.log(`${enemy.stats?.name || enemy.id}와(과) 전투 시작!`);
    if (enemy instanceof Commander) {
        world.map = enemy.battlefield;
        console.log(`전장 로드: 지휘관 ID ${enemy.commanderId}의 전쟁터`);
        player.x = 5;
        player.y = Math.floor(world.map.height / 2);
        enemy.x = world.map.width - 5;
        enemy.y = Math.floor(world.map.height / 2);
        // 전투 상태 전환 로직은 게임 시스템에 맞게 구현
    } else {
        // 다른 엔티티와의 전투 로직을 여기에 구현
    }
}
