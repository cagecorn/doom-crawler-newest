import { Worker } from 'node:worker_threads';
import { EventEmitter } from 'events';

export class MicroWorldWorker extends EventEmitter {
    constructor() {
        super();
        const url = new URL('./microWorldWorkerThread.js', import.meta.url);
        this.worker = new Worker(url, { type: 'module' });
        this.worker.on('message', msg => {
            if (msg.type === 'resolveAttackComplete' || msg.type === 'updateComplete') return;
            this.emit(msg.type, msg.payload);
        });
    }

    resolveAttack(attacker, defender) {
        return new Promise((resolve) => {
            const listener = (msg) => {
                if (msg.type === 'resolveAttackComplete') {
                    this.worker.off('message', listener);
                    resolve(msg);
                }
            };
            this.worker.on('message', listener);
            this.worker.postMessage({ type: 'resolveAttack', attacker, defender });
        });
    }

    update(items) {
        return new Promise((resolve) => {
            const listener = (msg) => {
                if (msg.type === 'updateComplete') {
                    this.worker.off('message', listener);
                    resolve();
                }
            };
            this.worker.on('message', listener);
            this.worker.postMessage({ type: 'update', items });
        });
    }

    postMessage(data) {
        this.worker.postMessage(data);
    }

    subscribe(event, handler) {
        this.on(event, handler);
    }

    terminate() {
        this.worker.terminate();
    }
}
