export class TimerManager {
    /**
     * @param {number} duration - 타이머의 지속 시간 (초 단위)
     * @param {function} onTimerEnd - 타이머가 종료됐을 때 실행할 콜백 함수
     */
    constructor(duration, onTimerEnd) {
        this.initialDuration = duration;
        this.onTimerEnd = onTimerEnd;
        this.remainingTime = duration;
        this.isRunning = false;
        console.log(`[TimerManager] Initialized with duration: ${this.initialDuration}s`);
    }

    /** 타이머를 시작합니다. */
    start() {
        this.remainingTime = this.initialDuration;
        this.isRunning = true;
        console.log('[TimerManager] Timer started.');
    }

    /** 타이머를 정지합니다. */
    stop() {
        this.isRunning = false;
        console.log('[TimerManager] Timer stopped.');
    }

    /**
     * 매 프레임마다 호출되어 남은 시간을 갱신합니다.
     * @param {number} deltaTime - 프레임 간의 시간 간격 (초 단위)
     */
    update(deltaTime) {
        if (!this.isRunning) return;

        this.remainingTime -= deltaTime;

        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            this.isRunning = false;
            console.log('[TimerManager] Time is up!');
            if (this.onTimerEnd) {
                this.onTimerEnd();
            }
        }
    }

    /**
     * 남은 시간을 반환합니다.
     * @returns {number} 남은 시간 (초 단위)
     */
    getRemainingTime() {
        return this.remainingTime;
    }
}
