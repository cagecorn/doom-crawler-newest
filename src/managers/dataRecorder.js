import { appendFileSync, writeFileSync } from 'fs';

export class DataRecorder {
    constructor(eventManager, filePath = 'record.jsonl', format = 'json') {
        this.filePath = filePath;
        this.format = format;
        try {
            writeFileSync(this.filePath, '', { flag: 'w' });
        } catch (e) {
            console.error('Failed to initialize data recorder file', e);
        }
        const events = ['log', 'damage_calculated', 'simulation_step'];
        events.forEach(evt => eventManager.subscribe(evt, data => this.write(evt, data)));
    }

    write(eventName, data = {}) {
        try {
            const line = this.format === 'csv'
                ? this.toCSV({ event: eventName, ...data })
                : JSON.stringify({ event: eventName, ...data });
            appendFileSync(this.filePath, line + '\n');
        } catch (e) {
            console.error('Failed to record data', e);
        }
    }

    toCSV(obj) {
        return Object.values(obj).map(v => {
            if (typeof v === 'object') {
                return JSON.stringify(v);
            }
            return String(v).replace(/,/g, ';');
        }).join(',');
    }
}
