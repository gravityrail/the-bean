import {
  Scene,
  UniversalCamera,
  Vector3,
  WebXRInputSource,
  WebXRDefaultExperience,
  Ray
} from '@babylonjs/core';
import { Bean, CameraView } from '../game/Bean';

export class ControlsManager {
  private scene: Scene;
  private bean: Bean;
  
  private keys: Map<string, boolean> = new Map();
  private mouseMovement: { x: number, y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private isVRMode: boolean = false;
  private xrHelper?: WebXRDefaultExperience;
  
  private leftController?: WebXRInputSource;
  private rightController?: WebXRInputSource;
  private movementInput: Vector3 = new Vector3(0, 0, 0);
  private rotationInput: number = 0;
  private lastKnownFloorHeight: number = 0;
  
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
      
      if (e.key === 'Escape') {
        if (this.isPointerLocked) {
          document.exitPointerLock();
        }
        // Dispatch event to return to menu
        window.dispatchEvent(new CustomEvent('returnToMenu'));
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
      // Only request pointer lock if we're in game (not in menu)
      const menuVisible = document.querySelector('.main-menu-visible');
      if (!this.isPointerLocked && !this.isVRMode && !menuVisible) {
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
    // Determine if this is left or right controller
    const handedness = controller.inputSource.handedness;
    console.log(`Setting up ${handedness} controller`);
    
    if (handedness === 'left') {
      this.leftController = controller;
      this.setupLeftController(controller);
    } else if (handedness === 'right') {
      this.rightController = controller;
      this.setupRightController(controller);
    }
  }
  
  private setupLeftController(controller: WebXRInputSource): void {
    controller.onMotionControllerInitObservable.add((motionController) => {
      // Left controller handles rotation in standard Babylon.js movement
      
      // X button for menu on Quest controllers
      const xButton = motionController.getComponent('x-button');
      if (xButton) {
        xButton.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            this.pulseController(controller, 0.2, 30);
            this.showVRMenu();
          }
        });
      }
      
      // Y button as alternative menu button
      const yButton = motionController.getComponent('y-button');
      if (yButton) {
        yButton.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            this.pulseController(controller, 0.2, 30);
            this.showVRMenu();
          }
        });
      }
    });
  }
  
  private setupRightController(controller: WebXRInputSource): void {
    controller.onMotionControllerInitObservable.add((motionController) => {
      // Right controller handles movement in standard Babylon.js movement
      
      // A button as alternative menu access
      const aButton = motionController.getComponent('a-button');
      if (aButton) {
        aButton.onButtonStateChangedObservable.add((component) => {
          if (component.pressed) {
            this.pulseController(controller, 0.2, 30);
            this.showVRMenu();
          }
        });
      }
      
      // Right trigger for running/speed boost
      const trigger = motionController.getComponent('xr-standard-trigger');
      if (trigger) {
        trigger.onButtonStateChangedObservable.add((component) => {
          this.bean.setRunning(component.pressed);
          if (component.pressed) {
            this.pulseController(controller, 0.3, 50);
          }
        });
      }
    });
  }
  
  private pulseController(controller: WebXRInputSource, intensity: number, duration: number): void {
    // Haptic feedback for enhanced VR immersion
    if (controller.inputSource.gamepad && 'hapticActuators' in controller.inputSource.gamepad) {
      const hapticActuators = (controller.inputSource.gamepad as any).hapticActuators;
      if (hapticActuators && hapticActuators.length > 0) {
        hapticActuators[0].pulse(intensity, duration).catch(() => {
          // Silently fail if haptics not supported
        });
      }
    }
  }
  
  private showVRMenu(): void {
    // Dispatch event to show VR menu
    window.dispatchEvent(new CustomEvent('showVRMenu'));
  }

  setVRMode(enabled: boolean, xrHelper?: WebXRDefaultExperience): void {
    this.isVRMode = enabled;
    this.xrHelper = xrHelper;
    
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
  
  setEnabled(enabled: boolean): void {
    if (!enabled) {
      this.releaseAllKeys();
      if (this.isPointerLocked) {
        document.exitPointerLock();
      }
    }
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
    
    // W/S and Up/Down arrows for forward/backward movement
    if (this.keys.get('w') || this.keys.get('arrowup')) forward = 1;
    if (this.keys.get('s') || this.keys.get('arrowdown')) forward = -1;
    
    // Z/X for strafing
    if (this.keys.get('z')) strafe = -1;  // Strafe left
    if (this.keys.get('x')) strafe = 1;   // Strafe right
    
    // A/D also strafe (alternative keys)
    if (this.keys.get('a')) strafe = -1;
    if (this.keys.get('d')) strafe = 1;
    
    // Left/Right arrow keys for rotation
    if (this.keys.get('arrowleft')) rotateSpeed = -2;   // Rotate left
    if (this.keys.get('arrowright')) rotateSpeed = 2;   // Rotate right
    
    this.bean.setRunning(this.keys.get('shift') || false);
    
    this.bean.move(forward, strafe, deltaTime);
    
    // Apply keyboard rotation
    if (rotateSpeed !== 0) {
      this.bean.rotate(rotateSpeed * deltaTime, 0);
    }
    
    // Apply mouse rotation for looking
    if (this.mouseMovement.x !== 0 || this.mouseMovement.y !== 0) {
      const yaw = this.mouseMovement.x * this.MOUSE_SENSITIVITY;
      const pitch = -this.mouseMovement.y * this.MOUSE_SENSITIVITY;
      
      this.bean.rotate(yaw, pitch);
      
      this.mouseMovement.x = 0;
      this.mouseMovement.y = 0;
    }
  }

  private updateVRControls(deltaTime: number): void {
    // Babylon's WebXR Movement feature handles locomotion
    // We sync Bean's position with the camera's world position
    if (this.xrHelper && this.xrHelper.baseExperience && this.xrHelper.baseExperience.camera) {
      const xrCamera = this.xrHelper.baseExperience.camera;
      
      // Get the camera's absolute world position
      const cameraWorldPos = xrCamera.globalPosition.clone();
      
      // Update Bean position to match camera position (X and Z only)
      this.bean.position.x = cameraWorldPos.x;
      this.bean.position.z = cameraWorldPos.z;
      
      // Keep Bean at floor level - no vertical movement from head pitch
      const floorHeight = this.detectFloorHeight(this.bean.position);
      this.bean.position.y = floorHeight + this.bean.HEIGHT;
      
      // CRITICAL: Force the XR camera to stay at ground level
      // The camera should ONLY move horizontally, never vertically from locomotion
      const desiredCameraHeight = floorHeight + 1.6; // Standard VR eye height
      
      // Calculate the difference between where the camera is and where it should be
      const heightError = cameraWorldPos.y - desiredCameraHeight;
      
      // Force the camera back to the correct height by adjusting its local position
      // This counteracts any vertical movement from the movement feature
      if (Math.abs(heightError) > 0.01) {
        // Adjust the camera's local position to compensate for unwanted vertical movement
        xrCamera.position.y = xrCamera.position.y - heightError;
      }
      
      // Calculate head direction for rotation (horizontal component only)
      const forward = xrCamera.getForwardRay().direction;
      // Project forward vector onto horizontal plane (ignore Y component)
      const horizontalForward = new Vector3(forward.x, 0, forward.z);
      if (horizontalForward.length() > 0.01) {
        horizontalForward.normalize();
        const headYaw = Math.atan2(horizontalForward.x, horizontalForward.z);
        
        // Update Bean rotation to match head yaw only (no pitch)
        this.bean.rotation.y = headYaw;
      }
      
      // Update Bean visual position
      this.bean.updatePosition(true);
    }
  }
  
  private detectFloorHeight(position: Vector3): number {
    // Cast a ray downward from well above to find the actual floor
    const rayStart = new Vector3(position.x, position.y + 10, position.z);
    const rayDirection = new Vector3(0, -1, 0);
    const ray = new Ray(rayStart, rayDirection, 20); // Long ray to find floor below
    
    // Pick all intersections, not just the first one
    const multiPickInfo = this.scene.multiPickWithRay(ray, (mesh) => {
      // Check for any walkable surface
      return !mesh.name.includes('bean') &&
             mesh.isVisible &&
             mesh.isEnabled();
    });
    
    if (multiPickInfo && multiPickInfo.length > 0) {
      // Find the hit point that's closest to but below our current position
      let closestFloor = -Infinity;
      
      for (const pickInfo of multiPickInfo) {
        if (pickInfo.hit && pickInfo.pickedPoint) {
          const hitY = pickInfo.pickedPoint.y;
          // Look for surfaces below or slightly above our current position
          // This should be the floor we're standing on or about to stand on
          if (hitY <= position.y + 0.5 && hitY > closestFloor) {
            closestFloor = hitY;
          }
        }
      }
      
      // If we found a floor below us, use it
      if (closestFloor > -Infinity) {
        this.lastKnownFloorHeight = closestFloor;
        return closestFloor;
      }
      
      // Otherwise, find the lowest surface (actual floor)
      let lowestY = Infinity;
      for (const pickInfo of multiPickInfo) {
        if (pickInfo.hit && pickInfo.pickedPoint) {
          const hitY = pickInfo.pickedPoint.y;
          if (hitY < lowestY) {
            lowestY = hitY;
          }
        }
      }
      
      if (lowestY < Infinity) {
        this.lastKnownFloorHeight = lowestY;
        return lowestY;
      }
    }
    
    // Use last known floor height if we can't detect one
    // This prevents sudden jumps
    return this.lastKnownFloorHeight;
  }
}