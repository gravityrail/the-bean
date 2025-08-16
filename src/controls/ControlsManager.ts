import {
  Scene,
  UniversalCamera,
  Vector3,
  WebXRInputSource
} from '@babylonjs/core';
import { Bean, CameraView } from '../game/Bean';

export class ControlsManager {
  private scene: Scene;
  private bean: Bean;
  
  private keys: Map<string, boolean> = new Map();
  private mouseMovement: { x: number, y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private isVRMode: boolean = false;
  
  private vrController?: WebXRInputSource;
  private movementInput: Vector3 = new Vector3(0, 0, 0);
  
  private readonly MOUSE_SENSITIVITY = 0.002;

  constructor(scene: Scene, _camera: UniversalCamera, bean: Bean) {
    this.scene = scene;
    this.bean = bean;
  }

  async init(): Promise<void> {
    this.setupKeyboardControls();
    this.setupMouseControls();
    this.setupPointerLock();
  }

  private setupKeyboardControls(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.set(key, true);
      
      if (e.key === 'Escape' && this.isPointerLocked) {
        document.exitPointerLock();
      }
      
      // Camera view switching
      if (key === '1') {
        this.bean.setCameraView(CameraView.FIRST_PERSON);
        this.updateInfoPanel('FPV');
      } else if (key === '2') {
        this.bean.setCameraView(CameraView.FOLLOW);
        this.updateInfoPanel('Follow');
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.set(e.key.toLowerCase(), false);
    });
  }

  private setupMouseControls(): void {
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked && !this.isVRMode) {
        this.mouseMovement.x += e.movementX;
        this.mouseMovement.y += e.movementY;
      }
    });
  }

  private setupPointerLock(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;
    
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked && !this.isVRMode) {
        canvas.requestPointerLock();
      }
    });
    
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
      
      const info = document.getElementById('info');
      if (info) {
        const clickText = info.querySelector('div:last-child');
        if (clickText) {
          clickText.textContent = this.isPointerLocked ? 'Press ESC to unlock mouse' : 'Click to start';
        }
      }
      
      const crosshair = document.getElementById('crosshair');
      if (crosshair) {
        crosshair.style.display = this.isPointerLocked ? 'block' : 'none';
      }
    });
  }

  setupVRController(controller: WebXRInputSource): void {
    this.vrController = controller;
    
    controller.onMotionControllerInitObservable.add((motionController) => {
      const xrInput = motionController.getComponentOfType('thumbstick');
      
      if (xrInput) {
        xrInput.onAxisValueChangedObservable.add((axes) => {
          this.movementInput.x = axes.x;
          this.movementInput.z = -axes.y;
        });
      }
      
      const triggerComponent = motionController.getComponentOfType('trigger');
      if (triggerComponent) {
        triggerComponent.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            this.bean.setRunning(true);
          } else {
            this.bean.setRunning(false);
          }
        });
      }
    });
  }

  setVRMode(enabled: boolean): void {
    this.isVRMode = enabled;
    
    if (enabled) {
      this.releaseAllKeys();
      if (this.isPointerLocked) {
        document.exitPointerLock();
      }
    }
  }

  releaseAllKeys(): void {
    this.keys.clear();
    this.bean.setRunning(false);
  }

  private updateInfoPanel(viewMode: string): void {
    const info = document.getElementById('info');
    if (info) {
      const viewDiv = info.querySelector('div:first-child');
      if (viewDiv) {
        viewDiv.textContent = `Bean Simulator v0.1.0 | View: ${viewMode}`;
      }
    }
  }

  update(deltaTime: number): void {
    if (this.isVRMode) {
      this.updateVRControls(deltaTime);
    } else {
      this.updateDesktopControls(deltaTime);
    }
  }

  private updateDesktopControls(deltaTime: number): void {
    if (!this.isPointerLocked) return;
    
    let forward = 0;
    let strafe = 0;
    let rotateSpeed = 0;
    
    if (this.keys.get('w') || this.keys.get('arrowup')) forward = 1;
    if (this.keys.get('s') || this.keys.get('arrowdown')) forward = -1;
    if (this.keys.get('a') || this.keys.get('arrowleft')) strafe = -1;
    if (this.keys.get('d') || this.keys.get('arrowright')) strafe = 1;
    
    // Z/X for rotation
    if (this.keys.get('z')) rotateSpeed = -2;  // Rotate left
    if (this.keys.get('x')) rotateSpeed = 2;   // Rotate right
    
    this.bean.setRunning(this.keys.get('shift') || false);
    
    this.bean.move(forward, strafe, deltaTime);
    
    // Apply keyboard rotation
    if (rotateSpeed !== 0) {
      this.bean.rotate(rotateSpeed * deltaTime, 0);
    }
    
    // Apply mouse rotation (only in FPV mode or if significant movement)
    if (this.mouseMovement.x !== 0 || this.mouseMovement.y !== 0) {
      const yaw = this.mouseMovement.x * this.MOUSE_SENSITIVITY;  // Removed negation for correct trackpad/mouse
      const pitch = -this.mouseMovement.y * this.MOUSE_SENSITIVITY;  // Keep pitch inverted (up = look up)
      
      this.bean.rotate(yaw, pitch);
      
      this.mouseMovement.x = 0;
      this.mouseMovement.y = 0;
    }
  }

  private updateVRControls(deltaTime: number): void {
    if (!this.vrController) return;
    
    const forward = -this.movementInput.z;
    const strafe = this.movementInput.x;
    
    this.bean.move(forward, strafe, deltaTime);
    
    const vrCamera = this.scene.activeCamera as any;
    if (vrCamera && vrCamera.rotation) {
      const headRotation = vrCamera.rotation.y;
      this.bean.rotation.y = headRotation;
    }
  }
}