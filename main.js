// main.js
import { Game } from './src/game.js';
import { registerServiceWorker } from './src/utils/swRegister.js';

window.onload = () => {
    registerServiceWorker();
    const game = new Game();
    game.start();
};
