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
  Color3,
  Color4
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { Inspector } from '@babylonjs/inspector';
import { World } from './World';
import { Bean } from './Bean';
import { ControlsManager } from '../controls/ControlsManager';

export class Game {
  private engine: Engine;
  private scene: Scene;
  private camera: UniversalCamera;
  private world: World;
  private bean: Bean;
  private controlsManager: ControlsManager;
  private xrHelper?: WebXRDefaultExperience;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true
    });
    
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
    
    this.world = new World(this.scene);
    this.bean = new Bean(this.scene, this.camera);
    this.controlsManager = new ControlsManager(this.scene, this.camera, this.bean);
    
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
    await this.world.init();
    await this.bean.init();
    await this.controlsManager.init();
    
    await this.setupWebXR();
    
    this.scene.registerBeforeRender(() => {
      const deltaTime = this.engine.getDeltaTime() / 1000;
      this.update(deltaTime);
    });
  }

  private async setupWebXR(): Promise<void> {
    try {
      const supported = await (WebXRDefaultExperience as any).IsSessionSupportedAsync('immersive-vr');
      
      if (supported) {
        this.xrHelper = await WebXRDefaultExperience.CreateAsync(this.scene, {
          uiOptions: {
            sessionMode: 'immersive-vr',
            referenceSpaceType: 'local-floor'
          },
          inputOptions: {
            doNotLoadControllerMeshes: false
          },
          floorMeshes: this.world.getFloorMeshes()
        });
        
        this.xrHelper.baseExperience.onStateChangedObservable.add((state) => {
          if (state === WebXRState.IN_XR) {
            console.log('Entered VR mode');
            this.controlsManager.setVRMode(true);
            
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
        
        const vrButton = document.getElementById('vr-button');
        if (vrButton) {
          vrButton.style.display = 'none';
        }
      } else {
        console.log('WebXR not supported');
        const vrButton = document.getElementById('vr-button');
        if (vrButton) {
          vrButton.style.display = 'none';
        }
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
    this.world.update(deltaTime, this.engine.getDeltaTime() / 1000);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
    
    window.addEventListener('blur', () => {
      this.controlsManager.releaseAllKeys();
    });
  }

  dispose(): void {
    this.stop();
    this.scene.dispose();
    this.engine.dispose();
  }
}