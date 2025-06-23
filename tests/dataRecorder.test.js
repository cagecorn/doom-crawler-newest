import { EventManager } from '../src/managers/eventManager.js';
import { DataRecorder } from '../src/managers/dataRecorder.js';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { describe, test, assert } from './helpers.js';

const DATA_PATH = './tests/tmp-data.jsonl';

describe('DataRecorder', () => {
    test('records events to file', () => {
        if (existsSync(DATA_PATH)) unlinkSync(DATA_PATH);
        const eventManager = new EventManager();
        new DataRecorder(eventManager, DATA_PATH, 'json');
        eventManager.publish('log', { message: 'hello' });
        eventManager.publish('damage_calculated', { damage: 5 });
        eventManager.publish('simulation_step', { step: 1 });
        const content = readFileSync(DATA_PATH, 'utf-8').trim().split('\n');
        assert.strictEqual(content.length, 3);
        const first = JSON.parse(content[0]);
        assert.strictEqual(first.event, 'log');
        assert.strictEqual(first.message, 'hello');
        unlinkSync(DATA_PATH);
    });
});
