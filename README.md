# Bean Simulator

A first-person 3D game featuring "Little Bean", a small white fluffy dog exploring a cozy house environment. Built with Babylon.js and WebXR for both desktop browsers and VR headsets (Meta Quest compatible).

## 🎮 Game Overview

**Player Character**: Little Bean - a small, white, cute fluffy dog  
**Setting**: A house with multiple rooms:
- Living room
- Kitchen  
- Music room
- Bathroom
- Dining room
- Front and back doors

## 🎯 Features

### Desktop Mode
- **Movement**: Arrow keys or WASD for walking
- **Camera**: Mouse movement for looking around (Quake-style controls)
- **Interaction**: Click to interact with objects

### VR Mode (WebXR)
- **Movement**: Controller thumbstick for locomotion
- **Camera**: Natural head tracking
- **Interaction**: Controller buttons for actions
- **Platform**: Meta Quest 2/3/Pro compatible

## 🏗️ Technical Architecture

### Core Technologies
- **Babylon.js**: Production-oriented 3D engine with excellent WebXR support
- **WebXRDefaultExperience**: Turnkey VR/AR with enter-XR UI, controller input, teleportation
- **Vite**: Build tool and dev server with HTTPS for WebXR
- **TypeScript**: Type safety and better developer experience

### Project Structure
```
bean-simulator/
├── src/
│   ├── main.ts              # Entry point
│   ├── game/
│   │   ├── Game.ts           # Main game class
│   │   ├── Bean.ts           # Player character
│   │   └── World.ts          # Environment setup
│   ├── controls/
│   │   └── ControlsManager.ts    # Unified control system for desktop and VR
│   ├── assets/
│   │   ├── models/           # 3D models (GLTF/GLB)
│   │   ├── textures/         # Texture files
│   │   └── sounds/           # Audio files
│   └── utils/
│       ├── AssetLoader.ts    # Resource management
│       └── Physics.ts        # Collision detection
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key Components

#### 1. Game Engine (`Game.ts`)
- Initializes Babylon.js engine, scene, and UniversalCamera
- Manages render loop and frame updates
- WebXRDefaultExperience for automatic VR support
- Coordinates all subsystems with shadow mapping

#### 2. Player Character (`Bean.ts`)
- Procedural dog model with spheres and cylinders
- Animated tail wagging and leg movement
- Position and rotation management
- First-person camera attachment

#### 3. Control Systems (`ControlsManager.ts`)
- **Desktop**: Pointer lock for mouse look, WASD/Arrow keys for movement
- **VR**: Automatic controller detection via WebXRDefaultExperience
- **Unified**: Seamless switching between desktop and VR modes
- **Features**: Run with Shift/Trigger, smooth locomotion

#### 4. World Environment (`World.ts`)
- Complete house with living room, kitchen, dining room, music room
- Furniture: couch, coffee table, dining table, chairs, piano, kitchen counter
- Lighting: Hemispheric + Directional with shadows
- Front and back doors for future outdoor expansion

## 📦 Dependencies

### Core Dependencies
```json
{
  "@babylonjs/core": "^7.36.0",
  "@babylonjs/gui": "^7.36.0",
  "@babylonjs/inspector": "^7.36.0",
  "@babylonjs/loaders": "^7.36.0",
  "@babylonjs/materials": "^7.36.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.6.0",
  "vite": "^5.4.0",
  "@vitejs/plugin-basic-ssl": "^1.1.0"
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern browser with WebGL2 support
- (Optional) Meta Quest headset for VR testing

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/bean-simulator.git
cd bean-simulator

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development Server
The dev server runs on HTTPS (required for WebXR) with a self-signed certificate:
```
https://localhost:5173
```

## 🎮 Controls Reference

### Desktop Controls
| Action | Control | Notes |
|--------|---------|-------|
| Move Forward | W / ↑ | Always moves in facing direction |
| Move Backward | S / ↓ | Always moves opposite to facing |
| Strafe Left | A / ← | Sidestep left relative to view |
| Strafe Right | D / → | Sidestep right relative to view |
| Rotate Left | Z | Turn left (useful in follow mode) |
| Rotate Right | X | Turn right (useful in follow mode) |
| Look Around | Mouse | Changes facing direction |
| Run | Shift | Hold for 2x speed |
| FPV Camera | 1 | First-person view (default) |
| Follow Camera | 2 | Third-person follow view |
| Interact | Left Click | Start game / capture mouse |

### VR Controls
| Action | Control |
|--------|---------|
| Move | Left Thumbstick |
| Turn | Right Thumbstick |
| Interact | Trigger |
| Menu | Menu Button |

## 🔧 Implementation Status

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Project setup with Vite and TypeScript
- [x] Babylon.js scene initialization
- [x] Full house environment with multiple rooms
- [x] Desktop controls (WASD + mouse look)
- [x] Player movement with run modifier

### ✅ Phase 2: VR Support (COMPLETED)
- [x] WebXRDefaultExperience integration
- [x] Controller thumbstick locomotion
- [x] Automatic VR/desktop mode switching
- [x] VR UI handling

### ✅ Phase 3: Little Bean (COMPLETED)
- [x] Procedural dog model creation
- [x] Tail wagging animation
- [x] Walking leg animations
- [x] First-person camera attachment

### ✅ Phase 4: Environment (COMPLETED)
- [x] Complete house geometry
- [x] Multiple furnished rooms
- [x] Shadow-mapped lighting
- [x] Furniture and decorations

### Phase 5: Polish
- [ ] Sound effects
- [ ] Particle effects
- [ ] Performance optimization
- [ ] Mobile browser support

## 💻 Developer Notes

### Why Babylon.js?
We switched from Three.js to Babylon.js based on these advantages:
- **WebXRDefaultExperience**: One-line VR setup with UI, controllers, teleportation
- **Inspector**: Built-in scene debugging (Ctrl+I in dev mode)
- **Better XR Support**: Active maintenance and Meta Quest optimization
- **Future-proof**: WebGPU support alongside WebGL2

### Architecture Decisions
1. **Unified Controls**: Single ControlsManager handles both desktop and VR
2. **Procedural Models**: Bean is created with primitives for fast iteration
3. **Shadow Mapping**: Enhanced realism with minimal performance cost
4. **HTTPS Required**: WebXR only works over secure connections

### Quick Commands
```bash
# Run tests
npm test

# Start dev server (HTTPS on port 5173)
npm run dev

# Type checking
npm run typecheck

# Production build
npm run build
```

### Debugging Tips
- Press Ctrl+I to open Babylon.js Inspector
- Check console for WebXR session state changes
- VR testing works best in Chrome/Edge
- Accept self-signed certificate for local HTTPS

## 🧪 Testing

### Local Testing
1. Run `npm run dev` to start the development server
2. Open `https://localhost:5173` in your browser
3. Accept the self-signed certificate warning

### VR Testing
1. Enable WebXR in your headset's browser settings
2. Navigate to the game URL
3. Click "Enter VR" button
4. Put on headset when prompted

### Browser Compatibility
- Chrome 90+ (recommended)
- Firefox 90+
- Edge 90+
- Safari 15+ (limited WebXR support)

## 📚 Resources

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Babylon.js WebXR Guide](https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRExperienceHelpers)
- [WebXR Device API](https://immersiveweb.dev/)
- [Meta Quest WebXR Guidelines](https://developer.oculus.com/documentation/web/)
- [Babylon.js Playground](https://playground.babylonjs.com/)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## 🐛 Known Issues

- WebXR requires HTTPS connection
- Some browsers require flags enabled for WebXR
- Hand tracking not yet implemented (controller only)

## 🗺️ Roadmap

- [ ] Multiplayer support
- [ ] Additional environments (backyard, neighborhood)
- [ ] Mini-games and activities
- [ ] Character customization
- [ ] Save system