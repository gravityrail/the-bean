import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode,
  DynamicTexture
} from '@babylonjs/core';
import { 
  AdvancedDynamicTexture,
  Button,
  TextBlock,
  StackPanel
} from '@babylonjs/gui';

export class VRMenu {
  private scene: Scene;
  private menuMesh?: Mesh;
  private menuGroup?: TransformNode;
  private advancedTexture?: AdvancedDynamicTexture;
  private isVisible: boolean = false;
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    window.addEventListener('showVRMenu', () => {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    });
  }
  
  show(): void {
    if (this.isVisible) return;
    
    // Create menu group
    this.menuGroup = new TransformNode('vrMenu', this.scene);
    
    // Create menu plane
    this.menuMesh = MeshBuilder.CreatePlane('vrMenuPlane', {
      width: 2,
      height: 1.5,
      sideOrientation: Mesh.DOUBLESIDE
    }, this.scene);
    
    // Position menu in front of the camera
    const camera = this.scene.activeCamera;
    if (camera) {
      // Place menu 2 meters in front of camera
      const forward = camera.getForwardRay(2).direction;
      this.menuMesh.position = camera.position.add(forward.scale(2));
      this.menuMesh.position.y = camera.position.y; // Keep at camera height
      
      // Make menu face the camera
      this.menuMesh.lookAt(camera.position);
      this.menuMesh.rotation.y += Math.PI; // Flip to face correct direction
    }
    
    // Create GUI texture
    this.advancedTexture = AdvancedDynamicTexture.CreateForMesh(
      this.menuMesh,
      1024,
      768,
      false
    );
    
    // Create menu panel
    const panel = new StackPanel();
    panel.width = "100%";
    panel.height = "100%";
    panel.background = "rgba(0, 0, 0, 0.9)";
    this.advancedTexture.addControl(panel);
    
    // Title
    const title = new TextBlock();
    title.text = "VR Menu";
    title.color = "white";
    title.fontSize = 72;
    title.height = "150px";
    title.paddingTop = "50px";
    panel.addControl(title);
    
    // Back to Menu button
    const backButton = Button.CreateSimpleButton('backBtn', 'Back to Main Menu');
    backButton.width = "600px";
    backButton.height = "120px";
    backButton.color = "white";
    backButton.fontSize = 48;
    backButton.background = "#4169E1";
    backButton.cornerRadius = 20;
    backButton.thickness = 0;
    backButton.paddingTop = "30px";
    backButton.paddingBottom = "30px";
    
    backButton.onPointerClickObservable.add(() => {
      this.hide();
      window.dispatchEvent(new CustomEvent('returnToMenu'));
    });
    
    panel.addControl(backButton);
    
    // Cancel button
    const cancelButton = Button.CreateSimpleButton('cancelBtn', 'Cancel');
    cancelButton.width = "600px";
    cancelButton.height = "120px";
    cancelButton.color = "white";
    cancelButton.fontSize = 48;
    cancelButton.background = "#666666";
    cancelButton.cornerRadius = 20;
    cancelButton.thickness = 0;
    cancelButton.paddingTop = "30px";
    
    cancelButton.onPointerClickObservable.add(() => {
      this.hide();
    });
    
    panel.addControl(cancelButton);
    
    // Instructions
    const instructions = new TextBlock();
    instructions.text = "Point controller and trigger to select";
    instructions.color = "#cccccc";
    instructions.fontSize = 36;
    instructions.height = "100px";
    instructions.paddingTop = "50px";
    panel.addControl(instructions);
    
    this.isVisible = true;
  }
  
  hide(): void {
    if (!this.isVisible) return;
    
    if (this.advancedTexture) {
      this.advancedTexture.dispose();
      this.advancedTexture = undefined;
    }
    
    if (this.menuMesh) {
      this.menuMesh.dispose();
      this.menuMesh = undefined;
    }
    
    if (this.menuGroup) {
      this.menuGroup.dispose();
      this.menuGroup = undefined;
    }
    
    this.isVisible = false;
  }
  
  dispose(): void {
    this.hide();
    window.removeEventListener('showVRMenu', () => {});
  }
}