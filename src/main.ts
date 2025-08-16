import { Game } from './game/Game';

async function main() {
  const loadingElement = document.getElementById('loading');
  const canvas = document.createElement('canvas');
  canvas.id = 'renderCanvas';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  
  const container = document.getElementById('app');
  if (!container) {
    console.error('App container not found');
    return;
  }
  
  container.appendChild(canvas);
  
  try {
    const game = new Game(canvas);
    await game.init();
    
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    game.start();
  } catch (error) {
    console.error('Failed to initialize game:', error);
    if (loadingElement) {
      loadingElement.textContent = 'Failed to load game. Please refresh.';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}