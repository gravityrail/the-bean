import { AdvancedDynamicTexture, StackPanel, Button, TextBlock, Checkbox } from '@babylonjs/gui';

export class MainMenu {
  private gui: AdvancedDynamicTexture;
  private container: StackPanel;
  private onWorldSelected: (worldName: string, useTeleport: boolean) => void;
  private teleportCheckbox?: Checkbox;
  
  constructor(onWorldSelected: (worldName: string, useTeleport: boolean) => void) {
    this.onWorldSelected = onWorldSelected;
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('MainMenu');
    this.container = new StackPanel();
    this.setupMenu();
  }
  
  private setupMenu(): void {
    this.container.width = "400px";
    this.container.height = "500px";
    this.container.paddingTop = "50px";
    this.container.paddingBottom = "50px";
    this.container.background = "rgba(0, 0, 0, 0.8)";
    this.gui.addControl(this.container);
    
    // Title
    const title = new TextBlock();
    title.text = "Bean Simulator";
    title.color = "white";
    title.fontSize = 48;
    title.height = "80px";
    title.paddingBottom = "20px";
    this.container.addControl(title);
    
    const subtitle = new TextBlock();
    subtitle.text = "Choose Your World";
    subtitle.color = "#87ceeb";
    subtitle.fontSize = 24;
    subtitle.height = "50px";
    subtitle.paddingBottom = "30px";
    this.container.addControl(subtitle);
    
    // World buttons
    this.createWorldButton(
      "Low Poly World",
      "Explore a cozy house with multiple rooms",
      "low-poly"
    );
    
    this.createWorldButton(
      "Home",
      "Photogrammetry scan",
      "home"
    );
    
    // VR Options
    this.createVROptions();
    
    // Instructions
    const instructions = new TextBlock();
    instructions.text = "Controls:\nWASD/Arrows: Move | Mouse: Look\nZ/X: Rotate | Shift: Run\n1: FPV | 2: Follow";
    instructions.color = "#cccccc";
    instructions.fontSize = 14;
    instructions.height = "100px";
    instructions.textWrapping = true;
    instructions.paddingTop = "30px";
    this.container.addControl(instructions);
  }
  
  private createVROptions(): void {
    // VR Options panel
    const vrPanel = new StackPanel();
    vrPanel.width = "350px";
    vrPanel.height = "50px";
    vrPanel.isVertical = false;
    vrPanel.paddingTop = "20px";
    vrPanel.paddingBottom = "10px";
    
    // Checkbox for teleport mode
    this.teleportCheckbox = new Checkbox();
    this.teleportCheckbox.width = "20px";
    this.teleportCheckbox.height = "20px";
    this.teleportCheckbox.isChecked = false;
    this.teleportCheckbox.color = "white";
    this.teleportCheckbox.background = "#4169E1";
    
    const checkboxLabel = new TextBlock();
    checkboxLabel.text = " Enable VR Teleportation (instead of smooth locomotion)";
    checkboxLabel.color = "#87ceeb";
    checkboxLabel.fontSize = 14;
    checkboxLabel.width = "320px";
    checkboxLabel.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
    checkboxLabel.paddingLeft = "10px";
    
    vrPanel.addControl(this.teleportCheckbox);
    vrPanel.addControl(checkboxLabel);
    
    this.container.addControl(vrPanel);
  }
  
  private createWorldButton(title: string, description: string, worldId: string): void {
    const button = Button.CreateSimpleButton(`btn-${worldId}`, "");
    button.width = "350px";
    button.height = "80px";
    button.color = "white";
    button.background = "#4169E1";
    button.cornerRadius = 10;
    button.thickness = 0;
    button.paddingTop = "10px";
    button.paddingBottom = "10px";
    button.hoverCursor = "pointer";
    
    // Button content panel
    const panel = new StackPanel();
    panel.isVertical = true;
    button.addControl(panel);
    
    const btnTitle = new TextBlock();
    btnTitle.text = title;
    btnTitle.color = "white";
    btnTitle.fontSize = 20;
    btnTitle.height = "30px";
    panel.addControl(btnTitle);
    
    const btnDesc = new TextBlock();
    btnDesc.text = description;
    btnDesc.color = "#e0e0e0";
    btnDesc.fontSize = 14;
    btnDesc.height = "25px";
    panel.addControl(btnDesc);
    
    button.onPointerEnterObservable.add(() => {
      button.background = "#5179F1";
    });
    
    button.onPointerOutObservable.add(() => {
      button.background = "#4169E1";
    });
    
    button.onPointerClickObservable.add(() => {
      this.hide();
      const useTeleport = this.teleportCheckbox?.isChecked || false;
      this.onWorldSelected(worldId, useTeleport);
    });
    
    this.container.addControl(button);
  }
  
  show(): void {
    this.gui.rootContainer.isVisible = true;
    // Add class to help identify menu state
    document.body.classList.add('main-menu-visible');
  }
  
  hide(): void {
    this.gui.rootContainer.isVisible = false;
    // Remove class when menu is hidden
    document.body.classList.remove('main-menu-visible');
  }
  
  dispose(): void {
    this.gui.dispose();
  }
}