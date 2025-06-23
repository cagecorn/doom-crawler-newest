export class InputHandler {
    constructor(eventManager, game) {
        this.eventManager = eventManager;
        this.game = game;
        this.keysPressed = {};

        document.addEventListener('keydown', (event) => this.handleKeyDown(event));

        document.addEventListener('keyup', (event) => {
            delete this.keysPressed[event.key];
        });

        document.addEventListener('wheel', (event) => {
            event.preventDefault();
            const direction = Math.sign(event.deltaY);
            this.eventManager.publish('mouse_wheel', { direction });
        }, { passive: false });
    }

    handleKeyDown(e) {
        this.keysPressed[e.key] = true;
        switch (e.key) {
            case 'd': // 'D' 키를 누르면 데이터 다운로드
                this.game?.dataRecorder?.downloadData();
                break;
            default:
                break;
        }
        // '1', '2' 같은 즉시 반응해야 하는 키는 여기서 이벤트 발행 가능
        if (['1', '2', '3', '4'].includes(e.key)) {
            this.eventManager.publish('key_pressed', { key: e.key });
        }
    }
}
