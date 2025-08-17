import {
  Scene,
  UniversalCamera,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  TransformNode,
  Animation,
  Engine,
  Ray,
  CubicEase
} from '@babylonjs/core';

export enum CameraView {
  FIRST_PERSON = 'FPV',
  FOLLOW = 'FOLLOW'
}

export class Bean {
  private scene: Scene;
  private camera: UniversalCamera;
  private group: TransformNode;
  private tail?: Mesh;
  private legs: Mesh[] = [];
  
  public position: Vector3;
  public rotation: Vector3;
  public velocity: Vector3;
  public isMoving: boolean = false;
  public isRunning: boolean = false;
  public cameraView: CameraView = CameraView.FIRST_PERSON;
  
  private bobAmount: number = 0;
  private elapsedTime: number = 0;
  
  public readonly HEIGHT = 0.8;
  private readonly CAMERA_HEIGHT = 1.2;
  private readonly FOLLOW_DISTANCE = 5;
  private readonly FOLLOW_HEIGHT = 3;

  constructor(scene: Scene, camera: UniversalCamera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new TransformNode('bean', scene);
    
    this.position = new Vector3(0, this.HEIGHT, 0);
    this.rotation = new Vector3(0, 0, 0);  // Default rotation
    this.velocity = new Vector3(0, 0, 0);
  }

  async init(): Promise<void> {
    this.createBeanModel();
    // Don't set target - let rotation handle the view direction
    this.updatePosition();
    this.setupAnimations();
  }

  private createBeanModel(): void {
    const whiteFurMaterial = new StandardMaterial('whiteFurMaterial', this.scene);
    whiteFurMaterial.diffuseColor = new Color3(0.98, 0.98, 0.94);
    whiteFurMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    whiteFurMaterial.emissiveColor = new Color3(0.02, 0.02, 0.02);
    
    const bodyMesh = MeshBuilder.CreateSphere('beanBody', {
      diameter: 0.4,  // Half the diameter for slimmer torso
      segments: 16
    }, this.scene);
    bodyMesh.scaling = new Vector3(1, 1.6, 1.5);  // Adjusted scaling for slimmer look
    bodyMesh.position.y = 0;
    bodyMesh.material = whiteFurMaterial;
    bodyMesh.receiveShadows = true;
    bodyMesh.parent = this.group;
    this.addToShadowMap(bodyMesh);
    
    const headMesh = MeshBuilder.CreateSphere('beanHead', {
      diameter: 0.5,
      segments: 12
    }, this.scene);
    headMesh.scaling = new Vector3(0.9, 0.9, 1);  // Swapped X and Z scaling
    headMesh.position = new Vector3(0, 0.1, 0.35);  // Head faces positive Z
    headMesh.material = whiteFurMaterial;
    headMesh.parent = this.group;
    this.addToShadowMap(headMesh);
    
    const earMesh1 = MeshBuilder.CreateCylinder('leftEar', {
      diameterTop: 0,
      diameterBottom: 0.16,
      height: 0.15,
      tessellation: 4
    }, this.scene);
    earMesh1.position = new Vector3(-0.1, 0.3, 0.35);  // Left ear
    earMesh1.rotation.z = 0.3;  // Positive rotation for left ear (mirror of right)
    earMesh1.material = whiteFurMaterial;
    earMesh1.parent = this.group;
    this.addToShadowMap(earMesh1);
    
    const earMesh2 = MeshBuilder.CreateCylinder('rightEar', {
      diameterTop: 0,
      diameterBottom: 0.16,
      height: 0.15,
      tessellation: 4
    }, this.scene);
    earMesh2.position = new Vector3(0.1, 0.3, 0.35);  // Right ear
    earMesh2.rotation.z = -0.3;  // Negative rotation for right ear
    earMesh2.material = whiteFurMaterial;
    earMesh2.parent = this.group;
    this.addToShadowMap(earMesh2);
    
    const noseMaterial = new StandardMaterial('noseMaterial', this.scene);
    noseMaterial.diffuseColor = new Color3(0, 0, 0);
    noseMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
    
    const nose = MeshBuilder.CreateSphere('nose', {
      diameter: 0.06,
      segments: 8
    }, this.scene);
    nose.position = new Vector3(0, 0.05, 0.58);  // Nose at front
    nose.material = noseMaterial;
    nose.parent = this.group;
    
    const eyeMaterial = new StandardMaterial('eyeMaterial', this.scene);
    eyeMaterial.diffuseColor = new Color3(0, 0, 0);
    eyeMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
    eyeMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05);
    
    const leftEye = MeshBuilder.CreateSphere('leftEye', {
      diameter: 0.08,
      segments: 8
    }, this.scene);
    leftEye.position = new Vector3(-0.08, 0.15, 0.45);  // Left eye
    leftEye.material = eyeMaterial;
    leftEye.parent = this.group;
    
    const rightEye = MeshBuilder.CreateSphere('rightEye', {
      diameter: 0.08,
      segments: 8
    }, this.scene);
    rightEye.position = new Vector3(0.08, 0.15, 0.45);  // Right eye
    rightEye.material = eyeMaterial;
    rightEye.parent = this.group;
    
    const tailMesh = MeshBuilder.CreateCylinder('tail', {
      diameterTop: 0.08,
      diameterBottom: 0.16,
      height: 0.3,
      tessellation: 6
    }, this.scene);
    tailMesh.position = new Vector3(0, 0.1, -0.4);  // Tail at back
    tailMesh.rotation.x = 0.5;  // Rotate tail along X axis now
    tailMesh.material = whiteFurMaterial;
    tailMesh.parent = this.group;
    this.tail = tailMesh;
    this.addToShadowMap(tailMesh);
    
    const legPositions = [
      { x: -0.15, z: 0.2 },   // Front left
      { x: 0.15, z: 0.2 },    // Front right
      { x: -0.15, z: -0.2 },  // Back left
      { x: 0.15, z: -0.2 }    // Back right
    ];
    
    legPositions.forEach((pos, index) => {
      const leg = MeshBuilder.CreateCylinder(`leg${index}`, {
        diameterTop: 0.1,
        diameterBottom: 0.12,
        height: 0.3,
        tessellation: 6
      }, this.scene);
      leg.position = new Vector3(pos.x, -0.25, pos.z);
      leg.material = whiteFurMaterial;
      leg.parent = this.group;
      this.legs.push(leg);
      this.addToShadowMap(leg);
    });
  }

  private setupAnimations(): void {
    if (this.tail) {
      const tailAnimation = new Animation(
        'tailWag',
        'rotation.y',  // Wag side to side now
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );
      
      const keys = [];
      keys.push({ frame: 0, value: -0.3 });
      keys.push({ frame: 15, value: 0.3 });
      keys.push({ frame: 30, value: -0.3 });
      
      tailAnimation.setKeys(keys);
      this.tail.animations = [tailAnimation];
      this.scene.beginAnimation(this.tail, 0, 30, true);
    }
  }

  update(deltaTime: number, _elapsedTime: number): void {
    this.elapsedTime += deltaTime;
    
    if (this.isMoving) {
      this.bobAmount = Math.sin(this.elapsedTime * 10) * 0.02;
      this.group.position.y = this.HEIGHT + this.bobAmount;
      
      this.legs.forEach((leg, index) => {
        const offset = index * Math.PI * 0.5;
        leg.rotation.z = Math.sin(this.elapsedTime * 8 + offset) * 0.3;  // Rotate along Z for forward walking
      });
    } else {
      this.group.position.y = this.HEIGHT;
      this.legs.forEach(leg => {
        leg.rotation.z = 0;
      });
    }
    
    this.updatePosition();
  }

  updatePosition(isVRMode: boolean = false): void {
    // Position the dog model
    this.group.position.x = this.position.x;
    this.group.position.z = this.position.z;
    this.group.rotation.y = this.rotation.y;  // Simple, direct rotation
    
    // Don't update camera position in VR mode - WebXR handles it
    if (!isVRMode) {
      if (this.cameraView === CameraView.FIRST_PERSON) {
        // First person view - camera at dog's eye level
        this.camera.position.x = this.position.x;
        this.camera.position.y = this.position.y + this.CAMERA_HEIGHT;
        this.camera.position.z = this.position.z;
      } else if (this.cameraView === CameraView.FOLLOW) {
        // Follow view - camera behind and above looking forward
        // Calculate camera position behind the player
        const cameraDistance = this.FOLLOW_DISTANCE;
        const cameraX = this.position.x - Math.sin(this.rotation.y) * cameraDistance;
        const cameraZ = this.position.z - Math.cos(this.rotation.y) * cameraDistance;
        
        this.camera.position.x = cameraX;
        this.camera.position.y = this.position.y + this.FOLLOW_HEIGHT;
        this.camera.position.z = cameraZ;
        
        // Look at a point in front of the dog
        const lookDistance = 10;
        const lookX = this.position.x + Math.sin(this.rotation.y) * lookDistance;
        const lookZ = this.position.z + Math.cos(this.rotation.y) * lookDistance;
        this.camera.setTarget(new Vector3(lookX, this.position.y + this.HEIGHT, lookZ));
      }
    }
  }

  move(forward: number, strafe: number, deltaTime: number): void {
    const speed = this.isRunning ? 12 : 6;
    const moveSpeed = speed * deltaTime;
    
    if (forward !== 0 || strafe !== 0) {
      this.isMoving = true;
      
      // Calculate movement vector
      const forwardX = Math.sin(this.rotation.y) * forward * moveSpeed;
      const forwardZ = Math.cos(this.rotation.y) * forward * moveSpeed;
      
      const strafeX = Math.cos(this.rotation.y) * strafe * moveSpeed;
      const strafeZ = -Math.sin(this.rotation.y) * strafe * moveSpeed;
      
      // Store old position for collision rollback
      const oldPosition = this.position.clone();
      
      // Apply movement
      this.position.x += forwardX + strafeX;
      this.position.z += forwardZ + strafeZ;
      
      // Check for collisions
      const moveDirection = new Vector3(forwardX + strafeX, 0, forwardZ + strafeZ);
      const collisionInfo = this.checkCollisionWithStepUp(moveDirection);
      
      if (collisionInfo.hit) {
        if (collisionInfo.canStepUp && collisionInfo.stepHeight !== undefined) {
          // Smooth hop up onto the obstacle
          const targetHeight = collisionInfo.stepHeight + this.HEIGHT;
          
          // Create a simple hop animation
          Animation.CreateAndStartAnimation(
            'beanHopUp',
            this.group,
            'position.y',
            30, // fps
            10, // frames
            this.position.y,
            targetHeight,
            Animation.ANIMATIONLOOPMODE_CONSTANT,
            new CubicEase(),
            () => {
              // Update position after animation
              this.position.y = targetHeight;
            }
          );
          
          // Update logical position immediately
          this.position.y = targetHeight;
          // Keep horizontal movement
        } else {
          // Normal collision - rollback
          this.position = oldPosition;
        }
      }
    } else {
      this.isMoving = false;
    }
  }
  
  private checkCollisionWithStepUp(moveDirection: Vector3): { hit: boolean; canStepUp: boolean; stepHeight?: number } {
    // Create ray from Bean's center in movement direction
    const rayOrigin = new Vector3(this.position.x, this.position.y, this.position.z);
    const rayLength = 0.4; // Bean's collision radius
    
    // Normalize movement direction for ray
    const normalizedDir = moveDirection.normalize();
    
    // Cast ray in movement direction at current height
    const ray = new Ray(rayOrigin, normalizedDir, rayLength);
    const pickInfo = this.scene.pickWithRay(ray, (mesh) => {
      // Don't collide with Bean's own parts, floors, or invisible meshes
      return !mesh.name.includes('bean') && 
             !mesh.name.includes('floor') && 
             !mesh.name.includes('ground') &&
             !mesh.name.includes('carpet') &&
             mesh.isVisible &&
             mesh.isEnabled() &&
             mesh.checkCollisions !== false;
    });
    
    if (!pickInfo?.hit) {
      return { hit: false, canStepUp: false };
    }
    
    // We hit something - check if we can step up onto it
    const obstacle = pickInfo.pickedMesh;
    if (!obstacle) {
      return { hit: true, canStepUp: false };
    }
    
    // Get the height of the obstacle
    const bounds = obstacle.getBoundingInfo().boundingBox;
    const obstacleTop = bounds.maximumWorld.y;
    const currentFloorHeight = this.position.y - this.HEIGHT;
    const stepHeight = obstacleTop - currentFloorHeight;
    
    // Maximum step-up height (2x Bean's height)
    const maxStepHeight = this.HEIGHT * 2;
    
    // Check if the obstacle is low enough to step onto
    if (stepHeight > 0 && stepHeight <= maxStepHeight) {
      // Also check if there's space above the obstacle for Bean
      const checkAboveOrigin = new Vector3(this.position.x, obstacleTop + this.HEIGHT, this.position.z);
      const checkAboveRay = new Ray(checkAboveOrigin, normalizedDir, rayLength);
      
      const abovePickInfo = this.scene.pickWithRay(checkAboveRay, (mesh) => {
        return !mesh.name.includes('bean') && 
               mesh.isVisible &&
               mesh.isEnabled() &&
               mesh.checkCollisions !== false;
      });
      
      // If there's no obstacle above, we can step up
      if (!abovePickInfo?.hit) {
        return { hit: true, canStepUp: true, stepHeight: obstacleTop };
      }
    }
    
    // Can't step up - normal collision
    return { hit: true, canStepUp: false };
  }

  rotate(yaw: number, pitch: number): void {
    this.rotation.y += yaw;
    
    if (this.cameraView === CameraView.FIRST_PERSON) {
      this.camera.rotation.y = this.rotation.y;
      this.camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.camera.rotation.x + pitch));
    }
    // In follow mode, camera target is set in updatePosition()
  }

  setRunning(running: boolean): void {
    this.isRunning = running;
  }

  setCameraView(view: CameraView): void {
    this.cameraView = view;
    
    if (view === CameraView.FIRST_PERSON) {
      // Reset camera rotation for FPV
      this.camera.rotation.x = 0;
      this.camera.rotation.y = this.rotation.y;
    }
    
    this.updatePosition();
    
    // Show/hide Bean model based on view
    this.group.setEnabled(view === CameraView.FOLLOW);
  }

  resetPosition(): void {
    this.position = new Vector3(0, this.HEIGHT, 0);
    this.rotation = new Vector3(0, 0, 0);
    this.camera.rotation = new Vector3(0, 0, 0);
    this.updatePosition();
  }

  private addToShadowMap(mesh: Mesh): void {
    const shadowGenerators = (this.scene as any).shadowGenerators;
    if (shadowGenerators && shadowGenerators.length > 0) {
      shadowGenerators[0].addShadowCaster(mesh);
    }
  }
}