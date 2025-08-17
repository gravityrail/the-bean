import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  TransformNode
} from '@babylonjs/core';
import { BaseWorld } from './BaseWorld';

export class LowPolyWorld extends BaseWorld {
  async init(): Promise<void> {
    this.createTestEnvironment();
    this.isLoaded = true;
  }

  private createTestEnvironment(): void {
    this.createFloor();
    this.createWalls();
    this.createFurniture();
  }

  private createFloor(): void {
    const floorMaterial = new StandardMaterial('floorMaterial', this.scene);
    floorMaterial.diffuseColor = new Color3(0.545, 0.451, 0.333);
    floorMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    const floor = MeshBuilder.CreateBox('floor', {
      width: 50,
      height: 0.5,
      depth: 50
    }, this.scene);
    floor.position.y = -0.25;
    floor.material = floorMaterial;
    floor.receiveShadows = true;
    floor.parent = this.roomGroup;
    this.floorMeshes.push(floor);
    
    const carpetMaterial = new StandardMaterial('carpetMaterial', this.scene);
    carpetMaterial.diffuseColor = new Color3(0.545, 0.271, 0.075);
    carpetMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    
    const carpet = MeshBuilder.CreateBox('carpet', {
      width: 15,
      height: 0.1,
      depth: 20
    }, this.scene);
    carpet.position = new Vector3(0, 0.05, 0);
    carpet.material = carpetMaterial;
    carpet.receiveShadows = true;
    carpet.parent = this.roomGroup;
    this.floorMeshes.push(carpet);
  }

  private createWalls(): void {
    const wallMaterial = new StandardMaterial('wallMaterial', this.scene);
    wallMaterial.diffuseColor = new Color3(0.961, 0.871, 0.702);
    wallMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    
    const backWall = MeshBuilder.CreateBox('backWall', {
      width: 50,
      height: 15,
      depth: 0.5
    }, this.scene);
    backWall.position = new Vector3(0, 7.5, -25);
    backWall.material = wallMaterial;
    backWall.receiveShadows = true;
    backWall.checkCollisions = true;
    backWall.parent = this.roomGroup;
    this.addToShadowMap(backWall);
    
    const frontWall = MeshBuilder.CreateBox('frontWall', {
      width: 50,
      height: 15,
      depth: 0.5
    }, this.scene);
    frontWall.position = new Vector3(0, 7.5, 25);
    frontWall.material = wallMaterial;
    frontWall.receiveShadows = true;
    frontWall.checkCollisions = true;
    frontWall.parent = this.roomGroup;
    this.addToShadowMap(frontWall);
    
    const leftWall = MeshBuilder.CreateBox('leftWall', {
      width: 0.5,
      height: 15,
      depth: 50
    }, this.scene);
    leftWall.position = new Vector3(-25, 7.5, 0);
    leftWall.material = wallMaterial;
    leftWall.receiveShadows = true;
    leftWall.checkCollisions = true;
    leftWall.parent = this.roomGroup;
    this.addToShadowMap(leftWall);
    
    const rightWall = MeshBuilder.CreateBox('rightWall', {
      width: 0.5,
      height: 15,
      depth: 50
    }, this.scene);
    rightWall.position = new Vector3(25, 7.5, 0);
    rightWall.material = wallMaterial;
    rightWall.receiveShadows = true;
    rightWall.checkCollisions = true;
    rightWall.parent = this.roomGroup;
    this.addToShadowMap(rightWall);
    
    const ceilingMaterial = new StandardMaterial('ceilingMaterial', this.scene);
    ceilingMaterial.diffuseColor = new Color3(1, 1, 1);
    ceilingMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    
    const ceiling = MeshBuilder.CreateBox('ceiling', {
      width: 50,
      height: 0.5,
      depth: 50
    }, this.scene);
    ceiling.position.y = 15;
    ceiling.material = ceilingMaterial;
    ceiling.receiveShadows = true;
    ceiling.parent = this.roomGroup;
  }

  private createFurniture(): void {
    const couchMaterial = new StandardMaterial('couchMaterial', this.scene);
    couchMaterial.diffuseColor = new Color3(0.255, 0.412, 0.882);
    couchMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    const couchGroup = new TransformNode('couch', this.scene);
    couchGroup.parent = this.roomGroup;
    
    const couchBase = MeshBuilder.CreateBox('couchBase', {
      width: 6,
      height: 1.5,
      depth: 2.5
    }, this.scene);
    couchBase.position = new Vector3(0, 0.75, -10);
    couchBase.material = couchMaterial;
    couchBase.receiveShadows = true;
    couchBase.checkCollisions = true;
    couchBase.parent = couchGroup;
    this.addToShadowMap(couchBase);
    
    const couchBack = MeshBuilder.CreateBox('couchBack', {
      width: 6,
      height: 2,
      depth: 0.5
    }, this.scene);
    couchBack.position = new Vector3(0, 1.5, -11);
    couchBack.material = couchMaterial;
    couchBack.receiveShadows = true;
    couchBack.checkCollisions = true;
    couchBack.parent = couchGroup;
    this.addToShadowMap(couchBack);
    
    const tableMaterial = new StandardMaterial('tableMaterial', this.scene);
    tableMaterial.diffuseColor = new Color3(0.545, 0.271, 0.075);
    tableMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
    
    const table = MeshBuilder.CreateBox('coffeeTable', {
      width: 3,
      height: 0.8,
      depth: 2
    }, this.scene);
    table.position = new Vector3(0, 0.4, -5);
    table.material = tableMaterial;
    table.receiveShadows = true;
    table.checkCollisions = true;
    table.parent = this.roomGroup;
    this.addToShadowMap(table);
    
    const counterMaterial = new StandardMaterial('counterMaterial', this.scene);
    counterMaterial.diffuseColor = new Color3(0.863, 0.863, 0.863);
    counterMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
    
    const kitchenCounter = MeshBuilder.CreateBox('kitchenCounter', {
      width: 8,
      height: 3,
      depth: 2
    }, this.scene);
    kitchenCounter.position = new Vector3(15, 1.5, 0);
    kitchenCounter.material = counterMaterial;
    kitchenCounter.receiveShadows = true;
    kitchenCounter.checkCollisions = true;
    kitchenCounter.parent = this.roomGroup;
    this.addToShadowMap(kitchenCounter);
    
    const woodMaterial = new StandardMaterial('woodMaterial', this.scene);
    woodMaterial.diffuseColor = new Color3(0.396, 0.263, 0.129);
    woodMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    const diningTable = MeshBuilder.CreateCylinder('diningTable', {
      diameter: 4,
      height: 0.8,
      tessellation: 8
    }, this.scene);
    diningTable.position = new Vector3(-10, 0.4, 8);
    diningTable.material = woodMaterial;
    diningTable.receiveShadows = true;
    diningTable.checkCollisions = true;
    diningTable.parent = this.roomGroup;
    this.addToShadowMap(diningTable);
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const chair = MeshBuilder.CreateBox(`chair${i}`, {
        width: 0.8,
        height: 1.5,
        depth: 0.8
      }, this.scene);
      chair.position = new Vector3(
        -10 + Math.cos(angle) * 3,
        0.75,
        8 + Math.sin(angle) * 3
      );
      chair.material = woodMaterial;
      chair.receiveShadows = true;
      chair.checkCollisions = true;
      chair.parent = this.roomGroup;
      this.addToShadowMap(chair);
    }
    
    const pianoGroup = new TransformNode('piano', this.scene);
    pianoGroup.parent = this.roomGroup;
    
    const pianoMaterial = new StandardMaterial('pianoMaterial', this.scene);
    pianoMaterial.diffuseColor = new Color3(0, 0, 0);
    pianoMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
    
    const pianoBody = MeshBuilder.CreateBox('pianoBody', {
      width: 4,
      height: 3,
      depth: 2
    }, this.scene);
    pianoBody.position = new Vector3(-15, 1.5, -15);
    pianoBody.material = pianoMaterial;
    pianoBody.receiveShadows = true;
    pianoBody.checkCollisions = true;
    pianoBody.parent = pianoGroup;
    this.addToShadowMap(pianoBody);
    
    const keysMaterial = new StandardMaterial('keysMaterial', this.scene);
    keysMaterial.diffuseColor = new Color3(1, 1, 1);
    keysMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
    
    const pianoKeys = MeshBuilder.CreateBox('pianoKeys', {
      width: 3.8,
      height: 0.2,
      depth: 0.8
    }, this.scene);
    pianoKeys.position = new Vector3(-15, 1.5, -14);
    pianoKeys.material = keysMaterial;
    pianoKeys.parent = pianoGroup;
    this.addToShadowMap(pianoKeys);
    
    const doorMaterial = new StandardMaterial('doorMaterial', this.scene);
    doorMaterial.diffuseColor = new Color3(0.545, 0.271, 0.075);
    doorMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    
    const door = MeshBuilder.CreateBox('frontDoor', {
      width: 3,
      height: 7,
      depth: 0.2
    }, this.scene);
    door.position = new Vector3(10, 3.5, 24.9);
    door.material = doorMaterial;
    door.receiveShadows = true;
    door.checkCollisions = true;
    door.parent = this.roomGroup;
    this.addToShadowMap(door);
    
    const backDoor = MeshBuilder.CreateBox('backDoor', {
      width: 3,
      height: 7,
      depth: 0.2
    }, this.scene);
    backDoor.position = new Vector3(-10, 3.5, -24.9);
    backDoor.material = doorMaterial;
    backDoor.receiveShadows = true;
    backDoor.checkCollisions = true;
    backDoor.parent = this.roomGroup;
    this.addToShadowMap(backDoor);
  }
}