import {
  SceneLoader,
  Vector3,
  Mesh,
  AbstractMesh,
  StandardMaterial,
  Color3
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { BaseWorld } from './BaseWorld';

export class HomeWorld extends BaseWorld {
  async init(): Promise<void> {
    try {
      console.log('Loading High Street world from /assets/8_16_2025.glb...');
      await this.loadGLTFModel();
      this.setupFloorCollision();
      this.isLoaded = true;
      console.log('High Street world loaded successfully');
    } catch (error) {
      console.error('Failed to load High Street world:', error);
      // Try to create a basic floor as fallback
      this.createFallbackWorld();
      this.isLoaded = true;
    }
  }
  
  private createFallbackWorld(): void {
    console.log('Creating fallback world due to loading error');
    
    // Create a simple floor so the player can still walk around
    const ground = Mesh.CreateGround('fallbackGround', 50, 50, 2, this.scene);
    ground.position.y = 0;
    ground.receiveShadows = true;
    ground.parent = this.roomGroup;
    this.floorMeshes.push(ground);
    
    // Add a simple material
    const mat = new StandardMaterial('fallbackMat', this.scene);
    mat.diffuseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = mat;
    
    alert('Failed to load the photogrammetry model. Showing fallback environment.');
  }

  private async loadGLTFModel(): Promise<void> {
    // Use absolute path for the asset
    const result = await SceneLoader.ImportMeshAsync(
      '',
      '/assets/',
      '8_16_2025_optimized.glb',
      this.scene
    );

    console.log('Loaded meshes:', result.meshes.length);
    
    // Process loaded meshes
    result.meshes.forEach((mesh) => {
      if (mesh instanceof Mesh) {
        // Set up the mesh
        mesh.parent = this.roomGroup;
        mesh.receiveShadows = true;
        
        // Add to shadow map if it's not too complex
        if (mesh.getTotalVertices() < 10000) {
          this.addToShadowMap(mesh);
        }
        
        // Check if this mesh should be a floor (based on name or position)
        if (this.isFloorMesh(mesh)) {
          this.floorMeshes.push(mesh);
          
          // Make floors more visible if needed
          if (!mesh.material) {
            const floorMat = new StandardMaterial('floorMat', this.scene);
            floorMat.diffuseColor = new Color3(0.7, 0.7, 0.7);
            mesh.material = floorMat;
          }
        }
        
        // Enable collisions
        mesh.checkCollisions = true;
      }
    });

    // Scale the environment to 2x size and flip along X axis to correct mirroring
    const scaleFactor = 2; // Make environment 2x larger
    this.roomGroup.scaling = new Vector3(-scaleFactor, scaleFactor, scaleFactor); // Negative X to flip/mirror
    
    // Center the world at origin if needed
    this.centerWorld();
  }

  private isFloorMesh(mesh: AbstractMesh): boolean {
    // Heuristic: consider meshes with 'floor' in name or at low Y position as floors
    const name = mesh.name.toLowerCase();
    if (name.includes('floor') || name.includes('ground') || name.includes('terrain')) {
      return true;
    }
    
    // Check if mesh is relatively flat and at a low position
    const bounds = mesh.getBoundingInfo().boundingBox;
    const height = bounds.maximumWorld.y - bounds.minimumWorld.y;
    const width = bounds.maximumWorld.x - bounds.minimumWorld.x;
    const depth = bounds.maximumWorld.z - bounds.minimumWorld.z;
    
    // If it's much wider than it is tall, and at a low position, it's probably a floor
    if (height < 0.5 && (width > height * 5 || depth > height * 5) && bounds.centerWorld.y < 2) {
      return true;
    }
    
    return false;
  }

  private setupFloorCollision(): void {
    // If no floor meshes were automatically detected, create an invisible one
    if (this.floorMeshes.length === 0) {
      console.log('No floor meshes detected, creating default floor');
      
      const floorMesh = Mesh.CreateGround('ground', 100, 100, 2, this.scene);
      floorMesh.position.y = 0;
      floorMesh.isVisible = false;
      floorMesh.checkCollisions = true;
      floorMesh.parent = this.roomGroup;
      this.floorMeshes.push(floorMesh);
    }
  }

  private centerWorld(): void {
    // Calculate the bounding box of all meshes
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    this.roomGroup.getChildMeshes().forEach((mesh) => {
      const bounds = mesh.getBoundingInfo().boundingBox;
      minX = Math.min(minX, bounds.minimumWorld.x);
      minY = Math.min(minY, bounds.minimumWorld.y);
      minZ = Math.min(minZ, bounds.minimumWorld.z);
      maxX = Math.max(maxX, bounds.maximumWorld.x);
      maxY = Math.max(maxY, bounds.maximumWorld.y);
      maxZ = Math.max(maxZ, bounds.maximumWorld.z);
    });
    

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    this.roomGroup.position.x = -centerX;
    this.roomGroup.position.y = -minY + 1.9; // Raise world up by 1.8m
    this.roomGroup.position.z = -centerZ;
    
    console.log(`World centered at: ${-centerX}, ${-minY}, ${-centerZ}`);
    console.log(`World size: ${maxX - minX} x ${maxY - minY} x ${maxZ - minZ}`);
  }
}