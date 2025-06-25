// main.js
import { Game } from './src/game.js';
import { registerServiceWorker } from './src/utils/swRegister.js';

let game = null;

window.onload = () => {
    registerServiceWorker();
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);
    game.start();
};
