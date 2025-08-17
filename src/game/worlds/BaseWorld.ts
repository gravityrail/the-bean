import { Scene, Mesh, TransformNode } from '@babylonjs/core';

export abstract class BaseWorld {
  protected scene: Scene;
  protected roomGroup: TransformNode;
  protected floorMeshes: Mesh[] = [];
  protected isLoaded: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
    this.roomGroup = new TransformNode('world', scene);
  }

  abstract init(): Promise<void>;
  
  getFloorMeshes(): Mesh[] {
    return this.floorMeshes;
  }

  update(_deltaTime: number, _elapsedTime: number): void {
    // Override in subclasses for animated elements
  }

  dispose(): void {
    this.roomGroup.dispose();
    this.floorMeshes = [];
    this.isLoaded = false;
  }

  protected addToShadowMap(mesh: Mesh): void {
    const shadowGenerators = (this.scene as any).shadowGenerators;
    if (shadowGenerators && shadowGenerators.length > 0) {
      shadowGenerators[0].addShadowCaster(mesh);
    }
  }
}