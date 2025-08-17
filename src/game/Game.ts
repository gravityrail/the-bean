import { 
  Engine, 
  Scene, 
  UniversalCamera, 
  Vector3, 
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  WebXRDefaultExperience,
  WebXRState,
  WebXRFeatureName,
  Color3,
  Color4
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { Inspector } from '@babylonjs/inspector';
import { BaseWorld } from './worlds/BaseWorld';
import { LowPolyWorld } from './worlds/LowPolyWorld';
import { HomeWorld } from './worlds/HomeWorld';
import { Bean } from './Bean';
import { ControlsManager } from '../controls/ControlsManager';
import { MainMenu } from '../ui/MainMenu';
import { VRMenu } from '../ui/VRMenu';
import { AudioManager } from '../audio/AudioManager';
import { AnimationManager } from '../animation/AnimationManager';

export class Game {
  private engine: Engine;
  private scene: Scene;
  private camera: UniversalCamera;
  private world?: BaseWorld;
  private mainMenu?: MainMenu;
  private vrMenu?: VRMenu;
  private bean: Bean;
  private controlsManager: ControlsManager;
  private audioManager: AudioManager;
  private animationManager: AnimationManager;
  private xrHelper?: WebXRDefaultExperience;
  private isRunning: boolean = false;
  private useTeleportation: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      adaptToDeviceRatio: true
    });
    
    // Optimize pixel ratio for VR (balance quality vs performance)
    const maxPixelRatio = 1.5; // Cap at 1.5 for better VR performance
    this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio, maxPixelRatio));
    
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.53, 0.81, 0.92, 1);
    this.scene.fogMode = Scene.FOGMODE_LINEAR;
    this.scene.fogColor = new Color3(0.53, 0.81, 0.92);
    this.scene.fogStart = 10;
    this.scene.fogEnd = 100;
    
    this.camera = new UniversalCamera(
      'camera',
      new Vector3(0, 1.6, 0),
      this.scene
    );
    this.camera.minZ = 0.1;
    this.camera.maxZ = 1000;
    this.camera.fov = 1.0472;
    this.camera.attachControl(false);
    
    this.bean = new Bean(this.scene, this.camera);
    this.controlsManager = new ControlsManager(this.scene, this.camera, this.bean);
    this.audioManager = new AudioManager(this.scene);
    this.animationManager = new AnimationManager(this.scene);
    
    this.setupLighting();
    this.setupEventListeners();
    
    if (import.meta.env.DEV) {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'i' && e.ctrlKey) {
          if (Inspector.IsVisible) {
            Inspector.Hide();
          } else {
            Inspector.Show(this.scene, {});
          }
        }
      });
    }
  }

  private setupLighting(): void {
    const hemisphericLight = new HemisphericLight(
      'hemisphericLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemisphericLight.intensity = 0.6;
    hemisphericLight.groundColor = new Color3(0.33, 0.33, 0.33);
    
    const directionalLight = new DirectionalLight(
      'directionalLight',
      new Vector3(-1, -2, -1),
      this.scene
    );
    directionalLight.position = new Vector3(10, 20, 10);
    directionalLight.intensity = 0.8;
    
    const shadowGenerator = new ShadowGenerator(2048, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 2;
    shadowGenerator.setDarkness(0.3);
    
    (this.scene as any).shadowGenerators = [shadowGenerator];
  }

  async init(): Promise<void> {
    // Initialize bean and controls first
    await this.bean.init();
    await this.controlsManager.init();
    
    // Initialize VR menu
    this.vrMenu = new VRMenu(this.scene);
    
    await this.setupWebXR();
    
    this.scene.registerBeforeRender(() => {
      const deltaTime = this.engine.getDeltaTime() / 1000;
      this.update(deltaTime);
    });
    
    // Show main menu
    this.showMainMenu();
  }
  
  private showMainMenu(): void {
    // Disable controls while in menu
    this.controlsManager.setEnabled(false);
    
    // Hide game UI while in menu
    const info = document.getElementById('info');
    if (info) info.style.display = 'none';
    
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    
    // Create and show menu
    this.mainMenu = new MainMenu((worldId, useTeleport) => {
      this.useTeleportation = useTeleport;
      this.loadWorld(worldId);
    });
    this.mainMenu.show();
  }
  
  private async loadWorld(worldId: string): Promise<void> {
    // Dispose current world if exists
    if (this.world) {
      this.world.dispose();
    }
    
    // Show loading
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
      loadingElement.textContent = 'Loading world...';
    }
    
    try {
      // Create new world based on selection
      if (worldId === 'low-poly') {
        this.world = new LowPolyWorld(this.scene);
      } else if (worldId === 'home') {
        this.world = new HomeWorld(this.scene);
      } else {
        throw new Error(`Unknown world: ${worldId}`);
      }
      
      await this.world.init();
      
      // Update XR floor meshes if needed
      if (this.xrHelper && this.xrHelper.teleportation) {
        // Re-setup teleportation with new floor meshes
        this.world.getFloorMeshes().forEach(mesh => {
          this.xrHelper?.teleportation?.addFloorMesh(mesh);
        });
      }
      
      // Reset player position
      this.bean.resetPosition();
      
      // Show game UI
      const info = document.getElementById('info');
      if (info) info.style.display = 'block';
      
      // Enable controls and start game
      this.controlsManager.setEnabled(true);
      
    } catch (error) {
      console.error('Failed to load world:', error);
      alert('Failed to load world. Please try again.');
      this.showMainMenu();
    } finally {
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
    }
  }

  private async setupWebXR(): Promise<void> {
    try {
      // Check if WebXR is supported
      const xrSupported = 'xr' in navigator;
      
      if (xrSupported) {
        this.xrHelper = await WebXRDefaultExperience.CreateAsync(this.scene, {
          uiOptions: {
            sessionMode: 'immersive-vr',
            referenceSpaceType: 'local-floor'
          },
          inputOptions: {
            doNotLoadControllerMeshes: false
          },
          floorMeshes: [],  // Will be set when world loads
          disableTeleportation: true  // Disable teleportation by default for movement
        });
        
        // Configure movement based on user preference
        const featureManager = this.xrHelper.baseExperience.featuresManager;
        
        if (this.useTeleportation) {
          // Re-enable teleportation if user wants it
          if (!this.xrHelper.teleportation) {
            featureManager.enableFeature(WebXRFeatureName.TELEPORTATION, 'stable', {
              xrInput: this.xrHelper.input,
              floorMeshes: this.world?.getFloorMeshes() || [],
              defaultTargetMeshOptions: {
                teleportationFillColor: '#55FF99',
                teleportationBorderColor: 'blue'
              }
            });
          }
        } else {
          // Enable smooth locomotion with standard Babylon.js controls
          // First, disable teleportation
          featureManager.disableFeature(WebXRFeatureName.TELEPORTATION);
          
          // Enable movement feature with settings for horizontal movement
          // Default: LEFT controller rotates, RIGHT controller moves
          const movementFeature = featureManager.enableFeature(WebXRFeatureName.MOVEMENT, 'latest', {
            xrInput: this.xrHelper.input,
            movementSpeed: 0.1,
            rotationSpeed: 0.1,
            // Movement follows head orientation for direction
            movementOrientationFollowsViewerPose: true
          });
          
          console.log('WebXR Movement enabled with standard Babylon.js controls');
          console.log('LEFT thumbstick: Rotation | RIGHT thumbstick: Movement');
        }
        
        this.xrHelper.baseExperience.onStateChangedObservable.add((state) => {
          if (state === WebXRState.IN_XR) {
            console.log('Entered VR mode');
            this.controlsManager.setVRMode(true, this.xrHelper);
            
            const info = document.getElementById('info');
            if (info) info.style.display = 'none';
            
            const crosshair = document.getElementById('crosshair');
            if (crosshair) crosshair.style.display = 'none';
          } else if (state === WebXRState.NOT_IN_XR) {
            console.log('Exited VR mode');
            this.controlsManager.setVRMode(false);
            
            const info = document.getElementById('info');
            if (info) info.style.display = 'block';
            
            const crosshair = document.getElementById('crosshair');
            if (crosshair) crosshair.style.display = 'block';
          }
        });
        
        this.xrHelper.input.onControllerAddedObservable.add((controller) => {
          this.controlsManager.setupVRController(controller);
        });
      } else {
        console.log('WebXR not supported');
      }
    } catch (error) {
      console.error('Failed to setup WebXR:', error);
    }
  }

  start(): void {
    this.isRunning = true;
    this.engine.runRenderLoop(() => {
      if (this.isRunning && this.scene) {
        this.scene.render();
      }
    });
  }

  stop(): void {
    this.isRunning = false;
    this.engine.stopRenderLoop();
  }

  private update(deltaTime: number): void {
    if (!this.isRunning) return;
    
    this.controlsManager.update(deltaTime);
    this.bean.update(deltaTime, this.engine.getDeltaTime() / 1000);
    if (this.world) {
      this.world.update(deltaTime, this.engine.getDeltaTime() / 1000);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    window.addEventListener('blur', () => {
      this.controlsManager.releaseAllKeys();
    });
    
    window.addEventListener('returnToMenu', () => {
      this.returnToMenu();
    });
  }
  
  private returnToMenu(): void {
    // Dispose current world
    if (this.world) {
      this.world.dispose();
      this.world = undefined;
    }
    
    // Show menu
    this.showMainMenu();
  }

  dispose(): void {
    this.stop();
    this.scene.dispose();
    this.engine.dispose();
  }
}