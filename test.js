import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🎮 Bean Simulator Test Suite');
console.log('============================\n');

let testsPass = 0;
let testsFail = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPass++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFail++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Check if all required files exist
test('All source files exist', () => {
  const requiredFiles = [
    'src/main.ts',
    'src/game/Game.ts',
    'src/game/World.ts',
    'src/game/Bean.ts',
    'src/controls/ControlsManager.ts',
    'index.html',
    'package.json',
    'tsconfig.json',
    'vite.config.ts'
  ];
  
  for (const file of requiredFiles) {
    assert(existsSync(file), `Missing file: ${file}`);
  }
});

// Test 2: Check package.json has correct dependencies
test('Package.json has Babylon.js dependencies', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  assert(packageJson.dependencies['@babylonjs/core'], 'Missing @babylonjs/core');
  assert(packageJson.dependencies['@babylonjs/gui'], 'Missing @babylonjs/gui');
  assert(packageJson.dependencies['@babylonjs/loaders'], 'Missing @babylonjs/loaders');
  assert(packageJson.dependencies['@babylonjs/inspector'], 'Missing @babylonjs/inspector');
});

// Test 3: Check if TypeScript files have proper imports
test('Game.ts imports Babylon.js correctly', () => {
  const gameContent = readFileSync('src/game/Game.ts', 'utf8');
  assert(gameContent.includes("from '@babylonjs/core'"), 'Game.ts missing Babylon.js imports');
  assert(gameContent.includes('WebXRDefaultExperience'), 'Game.ts missing WebXR support');
});

// Test 4: Check if Bean character is properly defined
test('Bean.ts has character model setup', () => {
  const beanContent = readFileSync('src/game/Bean.ts', 'utf8');
  assert(beanContent.includes('createBeanModel'), 'Bean missing model creation');
  assert(beanContent.includes('tail'), 'Bean missing tail');
  assert(beanContent.includes('legs'), 'Bean missing legs');
  assert(beanContent.includes('animations'), 'Bean missing animations');
});

// Test 5: Check if World has environment
test('World.ts has house environment', () => {
  const worldContent = readFileSync('src/game/World.ts', 'utf8');
  assert(worldContent.includes('createFloor'), 'World missing floor');
  assert(worldContent.includes('createWalls'), 'World missing walls');
  assert(worldContent.includes('createFurniture'), 'World missing furniture');
  assert(worldContent.includes('couch'), 'World missing couch');
  assert(worldContent.includes('piano'), 'World missing piano');
});

// Test 6: Check controls implementation
test('ControlsManager.ts has desktop and VR controls', () => {
  const controlsContent = readFileSync('src/controls/ControlsManager.ts', 'utf8');
  assert(controlsContent.includes('setupKeyboardControls'), 'Missing keyboard controls');
  assert(controlsContent.includes('setupMouseControls'), 'Missing mouse controls');
  assert(controlsContent.includes('setupVRController'), 'Missing VR controller support');
  assert(controlsContent.includes("keys.get('w')"), 'Missing WASD key mapping');
});

// Test 7: Check HTML has required elements
test('HTML has UI elements', () => {
  const htmlContent = readFileSync('index.html', 'utf8');
  assert(htmlContent.includes('id="app"'), 'Missing app container');
  assert(htmlContent.includes('id="info"'), 'Missing info panel');
  assert(htmlContent.includes('id="crosshair"'), 'Missing crosshair');
  assert(htmlContent.includes('id="vr-button"'), 'Missing VR button');
});

// Test 8: Check if build configuration is correct
test('Vite config has HTTPS enabled', () => {
  const viteContent = readFileSync('vite.config.ts', 'utf8');
  assert(viteContent.includes('https: true'), 'HTTPS not enabled');
  assert(viteContent.includes('basicSsl'), 'SSL plugin not configured');
});

console.log('\n============================');
console.log(`Tests passed: ${testsPass}`);
console.log(`Tests failed: ${testsFail}`);

if (testsFail === 0) {
  console.log('\n✨ All tests passed! Bean Simulator is ready to run.');
  console.log('Run "npm run dev" to start the development server.');
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  process.exit(1);
}