import { Worker } from 'node:worker_threads';

export class MicroWorldWorker {
    constructor() {
        const url = new URL('./microWorldWorkerThread.js', import.meta.url);
        this.worker = new Worker(url, { type: 'module' });
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

    terminate() {
        this.worker.terminate();
    }
}
