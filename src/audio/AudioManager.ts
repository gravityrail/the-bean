import { 
  Scene, 
  Sound, 
  Vector3,
  TransformNode
} from '@babylonjs/core';

export class AudioManager {
  private scene: Scene;
  private sounds: Map<string, Sound> = new Map();
  private ambientSounds: Sound[] = [];
  private footstepSound?: Sound;
  private isInitialized: boolean = false;
  
  constructor(scene: Scene) {
    this.scene = scene;
  }
  
  async init(): Promise<void> {
    // Initialize audio engine
    if (!this.scene.audioEnabled) {
      await this.scene.audioListenerPositionProvider();
    }
    
    // Pre-load common sounds
    await this.loadSounds();
    this.isInitialized = true;
  }
  
  private async loadSounds(): Promise<void> {
    // Footstep sound for Bean movement
    this.footstepSound = new Sound(
      'footstep',
      '/assets/audio/footstep.mp3',
      this.scene,
      null,
      {
        loop: true,
        autoplay: false,
        volume: 0.3,
        spatialSound: true,
        distanceModel: 'exponential',
        maxDistance: 20,
        refDistance: 1,
        rolloffFactor: 2
      }
    );
    
    // Ambient room sound
    const ambientSound = new Sound(
      'ambient',
      '/assets/audio/room-ambient.mp3',
      this.scene,
      null,
      {
        loop: true,
        autoplay: false,
        volume: 0.1,
        spatialSound: false
      }
    );
    
    this.ambientSounds.push(ambientSound);
  }
  
  playFootsteps(position: Vector3, isRunning: boolean = false): void {
    if (!this.footstepSound || !this.isInitialized) return;
    
    // Update position
    this.footstepSound.setPosition(position);
    
    // Adjust playback rate based on running
    this.footstepSound.setPlaybackRate(isRunning ? 1.5 : 1.0);
    this.footstepSound.setVolume(isRunning ? 0.5 : 0.3);
    
    if (!this.footstepSound.isPlaying) {
      this.footstepSound.play();
    }
  }
  
  stopFootsteps(): void {
    if (this.footstepSound?.isPlaying) {
      this.footstepSound.stop();
    }
  }
  
  play3DSound(
    name: string, 
    url: string, 
    position: Vector3,
    options?: {
      volume?: number;
      loop?: boolean;
      maxDistance?: number;
    }
  ): Sound {
    const sound = new Sound(
      name,
      url,
      this.scene,
      () => {
        sound.play();
      },
      {
        loop: options?.loop ?? false,
        autoplay: false,
        volume: options?.volume ?? 0.5,
        spatialSound: true,
        distanceModel: 'exponential',
        maxDistance: options?.maxDistance ?? 20,
        refDistance: 1,
        rolloffFactor: 2
      }
    );
    
    sound.setPosition(position);
    this.sounds.set(name, sound);
    
    return sound;
  }
  
  attachSoundToNode(sound: Sound | string, node: TransformNode): void {
    const soundObj = typeof sound === 'string' ? this.sounds.get(sound) : sound;
    if (soundObj) {
      soundObj.attachToMesh(node);
    }
  }
  
  startAmbient(): void {
    this.ambientSounds.forEach(sound => {
      if (!sound.isPlaying) {
        sound.play();
      }
    });
  }
  
  stopAmbient(): void {
    this.ambientSounds.forEach(sound => {
      sound.stop();
    });
  }
  
  setMasterVolume(volume: number): void {
    Engine.audioEngine?.setGlobalVolume(volume);
  }
  
  dispose(): void {
    this.sounds.forEach(sound => sound.dispose());
    this.sounds.clear();
    
    this.ambientSounds.forEach(sound => sound.dispose());
    this.ambientSounds = [];
    
    this.footstepSound?.dispose();
  }
}