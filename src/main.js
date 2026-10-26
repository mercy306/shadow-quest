import * as THREE from 'three';
import { Game } from './core/Game.js';

async function initGame() {
  const game = new Game();
  window.__GAME__ = game;
  if (import.meta.env.DEV) {
    window.THREE = THREE;
  }
  try {
    await game.init();
    game.isReady = true;
  } catch (err) {
    window.__INIT_ERROR__ = err ? err.stack || err.message || String(err) : 'Unknown error';
    console.error('Shadow Quest entry error:', err);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
