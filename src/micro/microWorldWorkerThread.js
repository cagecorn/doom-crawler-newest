import { parentPort } from 'node:worker_threads';
import { MicroCombatManager } from './MicroCombatManager.js';
import { MicroTurnManager } from './MicroTurnManager.js';

const combatManager = new MicroCombatManager({ publish: () => {} });
const turnManager = new MicroTurnManager();

parentPort.on('message', msg => {
    switch (msg.type) {
        case 'resolveAttack':
            combatManager.resolveAttack(msg.attacker, msg.defender);
            parentPort.postMessage({ type: 'resolveAttackComplete', attacker: msg.attacker, defender: msg.defender });
            break;
        case 'update':
            turnManager.update(msg.items);
            parentPort.postMessage({ type: 'updateComplete' });
            break;
    }
});
