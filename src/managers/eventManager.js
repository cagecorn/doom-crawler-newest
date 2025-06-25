// src/eventManager.js
export class EventManager {
    constructor() {
        this.listeners = {};
    }
    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }
    publish(eventName, data) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }
    }
}

// 공용 이벤트 버스를 필요로 하는 모듈을 위해 기본 인스턴스를 제공한다.
export const eventManager = new EventManager();
